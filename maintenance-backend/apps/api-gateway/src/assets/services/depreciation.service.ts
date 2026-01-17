import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '@app/database/entities/asset.entity';

export interface DepreciationResult {
  assetId: string;
  assetName: string;
  purchasePrice: number;
  currentValue: number;
  accumulatedDepreciation: number;
  depreciationMethod: string;
  usefulLifeYears: number;
  ageInYears: number;
  remainingLifeYears: number;
  annualDepreciation: number;
  monthlyDepreciation: number;
  salvageValue: number;
  isFullyDepreciated: boolean;
  projectedValues: { year: number; value: number }[];
}

@Injectable()
export class DepreciationService {
  private readonly logger = new Logger(DepreciationService.name);

  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  /**
   * Calculate depreciation for a single asset
   */
  async calculateDepreciation(assetId: string): Promise<DepreciationResult> {
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const purchasePrice = Number(asset.purchasePrice) || 0;
    const salvageValue = Number(asset.salvageValue) || 0;
    const usefulLifeYears = asset.usefulLifeYears || 5;
    const depreciationMethod = asset.depreciationMethod || 'straight_line';

    // Calculate age
    const installedDate = asset.installedDate ? new Date(asset.installedDate) : new Date();
    const ageInMs = Date.now() - installedDate.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365);

    let currentValue: number;
    let annualDepreciation: number;
    let accumulatedDepreciation: number;

    if (depreciationMethod === 'reducing_balance') {
      // Reducing balance method
      const rate = asset.annualDepreciationRate || (1 - Math.pow(salvageValue / purchasePrice, 1 / usefulLifeYears)) * 100;
      currentValue = purchasePrice * Math.pow(1 - rate / 100, ageInYears);
      annualDepreciation = currentValue * (rate / 100);
      accumulatedDepreciation = purchasePrice - currentValue;
    } else {
      // Straight-line method (default)
      annualDepreciation = (purchasePrice - salvageValue) / usefulLifeYears;
      accumulatedDepreciation = Math.min(annualDepreciation * ageInYears, purchasePrice - salvageValue);
      currentValue = Math.max(purchasePrice - accumulatedDepreciation, salvageValue);
    }

    const monthlyDepreciation = annualDepreciation / 12;
    const remainingLifeYears = Math.max(0, usefulLifeYears - ageInYears);
    const isFullyDepreciated = currentValue <= salvageValue;

    // Generate projected values for next 5 years
    const projectedValues: { year: number; value: number }[] = [];
    for (let i = 1; i <= 5; i++) {
      let projectedValue: number;
      if (depreciationMethod === 'reducing_balance') {
        const rate = asset.annualDepreciationRate || 20;
        projectedValue = currentValue * Math.pow(1 - rate / 100, i);
      } else {
        projectedValue = Math.max(currentValue - annualDepreciation * i, salvageValue);
      }
      projectedValues.push({ year: new Date().getFullYear() + i, value: projectedValue });
    }

    // Update asset current value
    asset.currentValue = currentValue;
    await this.assetRepository.save(asset);

    return {
      assetId: asset.id,
      assetName: asset.name,
      purchasePrice,
      currentValue,
      accumulatedDepreciation,
      depreciationMethod,
      usefulLifeYears,
      ageInYears: Math.round(ageInYears * 10) / 10,
      remainingLifeYears: Math.round(remainingLifeYears * 10) / 10,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
      salvageValue,
      isFullyDepreciated,
      projectedValues,
    };
  }

  /**
   * Calculate depreciation for all assets in an organization
   */
  async calculateBulkDepreciation(organizationId?: string): Promise<DepreciationResult[]> {
    const whereClause: any = {};
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const assets = await this.assetRepository.find({
      where: whereClause,
    });

    const results: DepreciationResult[] = [];
    for (const asset of assets) {
      if (asset.purchasePrice) {
        const result = await this.calculateDepreciation(asset.id);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get total asset valuation
   */
  async getTotalValuation(organizationId?: string): Promise<{
    totalPurchaseValue: number;
    totalCurrentValue: number;
    totalAccumulatedDepreciation: number;
    totalReplacementCost: number;
    assetCount: number;
    fullyDepreciatedCount: number;
  }> {
    const queryBuilder = this.assetRepository.createQueryBuilder('asset');

    if (organizationId) {
      queryBuilder.where('asset.organizationId = :organizationId', { organizationId });
    }

    const result = await queryBuilder
      .select('SUM(asset.purchasePrice)', 'totalPurchaseValue')
      .addSelect('SUM(asset.currentValue)', 'totalCurrentValue')
      .addSelect('SUM(asset.replacementCost)', 'totalReplacementCost')
      .addSelect('COUNT(*)', 'assetCount')
      .getRawOne();

    const fullyDepreciated = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.currentValue <= asset.salvageValue')
      .andWhere(organizationId ? 'asset.organizationId = :organizationId' : '1=1', { organizationId })
      .getCount();

    return {
      totalPurchaseValue: parseFloat(result.totalPurchaseValue) || 0,
      totalCurrentValue: parseFloat(result.totalCurrentValue) || 0,
      totalAccumulatedDepreciation:
        (parseFloat(result.totalPurchaseValue) || 0) - (parseFloat(result.totalCurrentValue) || 0),
      totalReplacementCost: parseFloat(result.totalReplacementCost) || 0,
      assetCount: parseInt(result.assetCount) || 0,
      fullyDepreciatedCount: fullyDepreciated,
    };
  }

  /**
   * Get depreciation schedule report
   */
  async getDepreciationSchedule(
    assetId: string,
    years: number = 10,
  ): Promise<{
    asset: { id: string; name: string; purchasePrice: number };
    schedule: { year: number; startValue: number; depreciation: number; endValue: number; accumulatedDepreciation: number }[];
  }> {
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const purchasePrice = Number(asset.purchasePrice) || 0;
    const salvageValue = Number(asset.salvageValue) || 0;
    const usefulLifeYears = asset.usefulLifeYears || 5;
    const depreciationMethod = asset.depreciationMethod || 'straight_line';
    const rate = asset.annualDepreciationRate || 20;

    const schedule: { year: number; startValue: number; depreciation: number; endValue: number; accumulatedDepreciation: number }[] = [];
    let currentValue = purchasePrice;
    let accumulatedDepreciation = 0;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < years && currentValue > salvageValue; i++) {
      const startValue = currentValue;
      let depreciation: number;

      if (depreciationMethod === 'reducing_balance') {
        depreciation = currentValue * (rate / 100);
      } else {
        depreciation = (purchasePrice - salvageValue) / usefulLifeYears;
      }

      depreciation = Math.min(depreciation, currentValue - salvageValue);
      currentValue = Math.max(currentValue - depreciation, salvageValue);
      accumulatedDepreciation += depreciation;

      schedule.push({
        year: currentYear + i,
        startValue: Math.round(startValue * 100) / 100,
        depreciation: Math.round(depreciation * 100) / 100,
        endValue: Math.round(currentValue * 100) / 100,
        accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      });
    }

    return {
      asset: { id: asset.id, name: asset.name, purchasePrice },
      schedule,
    };
  }
}
