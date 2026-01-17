import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MeterReading, MeterType } from '@app/database/entities/meter-reading.entity';
import { Asset } from '@app/database/entities/asset.entity';

export interface CreateMeterReadingDto {
  assetId: string;
  meterType: MeterType;
  customMeterName?: string;
  readingValue: number;
  unit?: string;
  recordedById?: string;
  recordedAt?: Date;
  notes?: string;
  source?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class MeterReadingService {
  private readonly logger = new Logger(MeterReadingService.name);

  constructor(
    @InjectRepository(MeterReading)
    private meterReadingRepository: Repository<MeterReading>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  /**
   * Create a new meter reading
   */
  async create(dto: CreateMeterReadingDto): Promise<MeterReading> {
    const asset = await this.assetRepository.findOne({ where: { id: dto.assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${dto.assetId} not found`);
    }

    // Get the last reading for this meter type
    const lastReading = await this.getLastReading(dto.assetId, dto.meterType);

    // Validate reading value
    if (lastReading && dto.readingValue < Number(lastReading.readingValue)) {
      throw new BadRequestException(
        `New reading (${dto.readingValue}) cannot be less than last reading (${lastReading.readingValue})`,
      );
    }

    const usageSinceLastReading = lastReading
      ? dto.readingValue - Number(lastReading.readingValue)
      : null;

    const reading = this.meterReadingRepository.create({
      ...dto,
      previousReadingValue: lastReading?.readingValue,
      usageSinceLastReading,
      recordedAt: dto.recordedAt || new Date(),
      source: dto.source || 'manual',
    });

    const saved = await this.meterReadingRepository.save(reading);

    // Update asset's current meter reading
    asset.currentMeterReading = dto.readingValue;
    asset.primaryMeterType = dto.meterType;
    asset.meterUnit = dto.unit;
    await this.assetRepository.save(asset);

    this.logger.log(`Created meter reading for asset ${dto.assetId}: ${dto.readingValue} ${dto.unit}`);
    return saved;
  }

  /**
   * Get last reading for an asset and meter type
   */
  async getLastReading(assetId: string, meterType: MeterType): Promise<MeterReading | null> {
    return await this.meterReadingRepository.findOne({
      where: { assetId, meterType },
      order: { recordedAt: 'DESC' },
    });
  }

  /**
   * Get all readings for an asset
   */
  async findByAsset(
    assetId: string,
    options?: {
      meterType?: MeterType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<MeterReading[]> {
    const queryBuilder = this.meterReadingRepository
      .createQueryBuilder('reading')
      .leftJoinAndSelect('reading.recordedBy', 'user')
      .where('reading.assetId = :assetId', { assetId });

    if (options?.meterType) {
      queryBuilder.andWhere('reading.meterType = :meterType', {
        meterType: options.meterType,
      });
    }

    if (options?.startDate && options?.endDate) {
      queryBuilder.andWhere('reading.recordedAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    }

    queryBuilder.orderBy('reading.recordedAt', 'DESC');

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get usage statistics for an asset
   */
  async getUsageStats(
    assetId: string,
    meterType: MeterType,
    days: number = 30,
  ): Promise<{
    totalUsage: number;
    averageDailyUsage: number;
    currentReading: number;
    readingCount: number;
    firstReading: number;
    lastReading: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await this.meterReadingRepository.find({
      where: {
        assetId,
        meterType,
      },
      order: { recordedAt: 'ASC' },
    });

    if (readings.length === 0) {
      return {
        totalUsage: 0,
        averageDailyUsage: 0,
        currentReading: 0,
        readingCount: 0,
        firstReading: 0,
        lastReading: 0,
      };
    }

    const firstReading = Number(readings[0].readingValue);
    const lastReading = Number(readings[readings.length - 1].readingValue);
    const totalUsage = lastReading - firstReading;
    const averageDailyUsage = totalUsage / days;

    return {
      totalUsage,
      averageDailyUsage,
      currentReading: lastReading,
      readingCount: readings.length,
      firstReading,
      lastReading,
    };
  }

  /**
   * Bulk import meter readings
   */
  async bulkImport(
    readings: CreateMeterReadingDto[],
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const reading of readings) {
      try {
        await this.create(reading);
        success++;
      } catch (error) {
        failed++;
        errors.push(`Asset ${reading.assetId}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Get meter readings requiring attention (PM triggers)
   */
  async getReadingsNearThreshold(
    threshold: number,
    meterType: MeterType,
    organizationId?: string,
  ): Promise<Asset[]> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.currentMeterReading >= :threshold', { threshold })
      .andWhere('asset.primaryMeterType = :meterType', { meterType });

    if (organizationId) {
      queryBuilder.andWhere('asset.organizationId = :organizationId', { organizationId });
    }

    return await queryBuilder.getMany();
  }
}
