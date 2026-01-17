import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AssetHistory, AssetHistoryEventType } from '@app/database/entities/asset-history.entity';
import { Asset } from '@app/database/entities/asset.entity';

export interface CreateAssetHistoryDto {
  assetId: string;
  eventType: AssetHistoryEventType;
  description?: string;
  laborCost?: number;
  partsCost?: number;
  downtimeCost?: number;
  downtimeMinutes?: number;
  workOrderId?: string;
  performedById?: string;
  performedAt?: Date;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class AssetHistoryService {
  private readonly logger = new Logger(AssetHistoryService.name);

  constructor(
    @InjectRepository(AssetHistory)
    private assetHistoryRepository: Repository<AssetHistory>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  /**
   * Create a new history entry
   */
  async create(dto: CreateAssetHistoryDto): Promise<AssetHistory> {
    const asset = await this.assetRepository.findOne({ where: { id: dto.assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${dto.assetId} not found`);
    }

    const totalCost = (dto.laborCost || 0) + (dto.partsCost || 0) + (dto.downtimeCost || 0);

    const history = this.assetHistoryRepository.create({
      ...dto,
      totalCost,
      performedAt: dto.performedAt || new Date(),
    });

    const saved = await this.assetHistoryRepository.save(history);

    // Update asset maintenance totals
    asset.totalMaintenanceCount += 1;
    asset.totalMaintenanceCost = Number(asset.totalMaintenanceCost) + totalCost;
    asset.lastMaintenanceDate = new Date();
    await this.assetRepository.save(asset);

    this.logger.log(`Created history entry for asset ${dto.assetId}: ${dto.eventType}`);
    return saved;
  }

  /**
   * Get history for an asset
   */
  async findByAsset(
    assetId: string,
    options?: {
      eventType?: AssetHistoryEventType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<AssetHistory[]> {
    const queryBuilder = this.assetHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.performedBy', 'user')
      .where('history.assetId = :assetId', { assetId });

    if (options?.eventType) {
      queryBuilder.andWhere('history.eventType = :eventType', {
        eventType: options.eventType,
      });
    }

    if (options?.startDate && options?.endDate) {
      queryBuilder.andWhere('history.performedAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    }

    queryBuilder.orderBy('history.performedAt', 'DESC');

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get total costs for an asset
   */
  async getTotalCosts(assetId: string): Promise<{
    laborCost: number;
    partsCost: number;
    downtimeCost: number;
    totalCost: number;
    maintenanceCount: number;
  }> {
    const result = await this.assetHistoryRepository
      .createQueryBuilder('history')
      .select('SUM(history.laborCost)', 'laborCost')
      .addSelect('SUM(history.partsCost)', 'partsCost')
      .addSelect('SUM(history.downtimeCost)', 'downtimeCost')
      .addSelect('SUM(history.totalCost)', 'totalCost')
      .addSelect('COUNT(*)', 'maintenanceCount')
      .where('history.assetId = :assetId', { assetId })
      .getRawOne();

    return {
      laborCost: parseFloat(result.laborCost) || 0,
      partsCost: parseFloat(result.partsCost) || 0,
      downtimeCost: parseFloat(result.downtimeCost) || 0,
      totalCost: parseFloat(result.totalCost) || 0,
      maintenanceCount: parseInt(result.maintenanceCount) || 0,
    };
  }

  /**
   * Log asset update
   */
  async logUpdate(
    assetId: string,
    previousValues: Record<string, any>,
    newValues: Record<string, any>,
    userId?: string,
  ): Promise<AssetHistory> {
    return await this.create({
      assetId,
      eventType: AssetHistoryEventType.UPDATED,
      description: 'Asset details updated',
      previousValues,
      newValues,
      performedById: userId,
    });
  }

  /**
   * Log status change
   */
  async logStatusChange(
    assetId: string,
    previousStatus: string,
    newStatus: string,
    userId?: string,
    reason?: string,
  ): Promise<AssetHistory> {
    return await this.create({
      assetId,
      eventType: AssetHistoryEventType.STATUS_CHANGED,
      description: reason || `Status changed from ${previousStatus} to ${newStatus}`,
      previousValues: { status: previousStatus },
      newValues: { status: newStatus },
      performedById: userId,
    });
  }

  /**
   * Log maintenance performed
   */
  async logMaintenance(
    assetId: string,
    workOrderId: string,
    description: string,
    costs: { labor?: number; parts?: number; downtime?: number },
    downtimeMinutes?: number,
    userId?: string,
  ): Promise<AssetHistory> {
    return await this.create({
      assetId,
      eventType: AssetHistoryEventType.MAINTENANCE_PERFORMED,
      description,
      laborCost: costs.labor,
      partsCost: costs.parts,
      downtimeCost: costs.downtime,
      downtimeMinutes,
      workOrderId,
      performedById: userId,
    });
  }

  /**
   * Get recent history across all assets
   */
  async getRecentHistory(
    organizationId?: string,
    limit: number = 50,
  ): Promise<AssetHistory[]> {
    const queryBuilder = this.assetHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.asset', 'asset')
      .leftJoinAndSelect('history.performedBy', 'user');

    if (organizationId) {
      queryBuilder.andWhere('asset.organizationId = :organizationId', { organizationId });
    }

    return await queryBuilder
      .orderBy('history.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
