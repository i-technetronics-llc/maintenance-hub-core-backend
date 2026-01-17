import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { MeterReading, MeterType } from '@app/database/entities/meter-reading.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { PMSchedule, PMTriggerType } from '@app/database/entities/pm-schedule.entity';
import { CreateMeterReadingDto, QueryMeterReadingsDto } from './dto';
import { PreventiveMaintenanceService } from '../preventive-maintenance/preventive-maintenance.service';

@Injectable()
export class MeterReadingsService {
  private readonly logger = new Logger(MeterReadingsService.name);

  constructor(
    @InjectRepository(MeterReading)
    private meterReadingRepository: Repository<MeterReading>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(PMSchedule)
    private pmScheduleRepository: Repository<PMSchedule>,
    @Inject(forwardRef(() => PreventiveMaintenanceService))
    private pmService: PreventiveMaintenanceService,
  ) {}

  /**
   * Create a new meter reading and check for PM triggers
   */
  async create(
    createDto: CreateMeterReadingDto,
    recordedById?: string,
  ): Promise<MeterReading> {
    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: createDto.assetId },
    });

    if (!asset) {
      throw new NotFoundException(
        `Asset with ID '${createDto.assetId}' not found`,
      );
    }

    // Get the previous reading for this asset and meter type
    const previousReading = await this.getLatestReading(
      createDto.assetId,
      createDto.meterType,
    );

    // Calculate usage since last reading
    let usageSinceLastReading: number | null = null;
    let previousReadingValue: number | null = null;

    if (previousReading) {
      previousReadingValue = Number(previousReading.readingValue);
      usageSinceLastReading =
        createDto.readingValue - previousReadingValue;

      // Validate reading is not lower than previous (unless it's a reset scenario)
      if (usageSinceLastReading < 0 && createDto.source !== 'meter_reset') {
        this.logger.warn(
          `Meter reading for asset ${createDto.assetId} appears to have decreased. ` +
            `Previous: ${previousReadingValue}, New: ${createDto.readingValue}`,
        );
      }
    }

    // Create the meter reading
    const meterReading = this.meterReadingRepository.create({
      ...createDto,
      recordedAt: new Date(createDto.recordedAt),
      recordedById,
      previousReadingValue,
      usageSinceLastReading,
    });

    const savedReading = await this.meterReadingRepository.save(meterReading);

    // Update the asset's current meter reading
    if (
      asset.primaryMeterType === createDto.meterType ||
      !asset.primaryMeterType
    ) {
      asset.currentMeterReading = createDto.readingValue;
      if (!asset.primaryMeterType) {
        asset.primaryMeterType = createDto.meterType;
      }
      if (createDto.unit && !asset.meterUnit) {
        asset.meterUnit = createDto.unit;
      }
      await this.assetRepository.save(asset);
    }

    // Check and trigger meter-based PMs
    await this.checkAndTriggerMeterBasedPMs(
      createDto.assetId,
      createDto.meterType,
      createDto.readingValue,
    );

    this.logger.log(
      `Recorded meter reading ${savedReading.id} for asset ${createDto.assetId}: ` +
        `${createDto.meterType} = ${createDto.readingValue}`,
    );

    return savedReading;
  }

  /**
   * Get meter readings for an asset with optional filters
   */
  async findByAsset(
    assetId: string,
    query: QueryMeterReadingsDto,
  ): Promise<{ readings: MeterReading[]; total: number }> {
    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID '${assetId}' not found`);
    }

    const whereClause: any = { assetId };

    if (query.meterType) {
      whereClause.meterType = query.meterType;
    }

    if (query.startDate && query.endDate) {
      whereClause.recordedAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      whereClause.recordedAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      whereClause.recordedAt = LessThanOrEqual(new Date(query.endDate));
    }

    const [readings, total] = await this.meterReadingRepository.findAndCount({
      where: whereClause,
      relations: ['recordedBy'],
      order: { recordedAt: 'DESC' },
      take: query.limit || 100,
      skip: query.offset || 0,
    });

    return { readings, total };
  }

  /**
   * Get the latest meter reading for an asset
   */
  async getLatest(
    assetId: string,
    meterType?: MeterType,
  ): Promise<MeterReading | null> {
    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID '${assetId}' not found`);
    }

    return this.getLatestReading(assetId, meterType);
  }

  /**
   * Internal method to get latest reading
   */
  private async getLatestReading(
    assetId: string,
    meterType?: MeterType,
  ): Promise<MeterReading | null> {
    const whereClause: any = { assetId };
    if (meterType) {
      whereClause.meterType = meterType;
    }

    return await this.meterReadingRepository.findOne({
      where: whereClause,
      order: { recordedAt: 'DESC' },
    });
  }

  /**
   * Check and trigger meter-based PMs when a reading exceeds threshold
   */
  async checkAndTriggerMeterBasedPMs(
    assetId: string,
    meterType: MeterType | string,
    currentReading: number,
  ): Promise<void> {
    // Find all active meter-based PM schedules for this asset and meter type
    const meterBasedPMs = await this.pmScheduleRepository.find({
      where: {
        assetId,
        isActive: true,
        triggerType: PMTriggerType.METER_BASED,
        meterType: meterType as string,
      },
    });

    // Also check hybrid PMs that have meter conditions
    const hybridPMs = await this.pmScheduleRepository.find({
      where: {
        assetId,
        isActive: true,
        triggerType: PMTriggerType.HYBRID,
        meterType: meterType as string,
      },
    });

    const allPMs = [...meterBasedPMs, ...hybridPMs];

    for (const pm of allPMs) {
      if (!pm.nextMeterDue || !pm.meterInterval) {
        continue;
      }

      const nextMeterDue = Number(pm.nextMeterDue);

      // Check if current reading has reached or exceeded the next due meter value
      if (currentReading >= nextMeterDue) {
        this.logger.log(
          `Meter-based PM trigger reached for schedule ${pm.id} (${pm.name}). ` +
            `Current: ${currentReading}, Due at: ${nextMeterDue}`,
        );

        try {
          // Generate work order
          await this.pmService.generateWorkOrderForMeterTrigger(pm.id, currentReading);

          // Update the PM schedule with new next meter due
          const meterInterval = Number(pm.meterInterval);
          pm.lastMeterReading = currentReading;
          pm.nextMeterDue = currentReading + meterInterval;
          await this.pmScheduleRepository.save(pm);

          this.logger.log(
            `Updated PM schedule ${pm.id} - Next meter due: ${pm.nextMeterDue}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to trigger meter-based PM ${pm.id}: ${error.message}`,
          );
        }
      }
    }
  }

  /**
   * Get meter reading statistics for an asset
   */
  async getReadingStatistics(
    assetId: string,
    meterType: MeterType,
    days: number = 30,
  ): Promise<{
    averageDaily: number;
    totalUsage: number;
    readingCount: number;
    projectedNextMilestone: number | null;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await this.meterReadingRepository.find({
      where: {
        assetId,
        meterType,
        recordedAt: MoreThanOrEqual(startDate),
      },
      order: { recordedAt: 'ASC' },
    });

    if (readings.length < 2) {
      return {
        averageDaily: 0,
        totalUsage: 0,
        readingCount: readings.length,
        projectedNextMilestone: null,
      };
    }

    const firstReading = Number(readings[0].readingValue);
    const lastReading = Number(readings[readings.length - 1].readingValue);
    const totalUsage = lastReading - firstReading;

    const daysDiff =
      (readings[readings.length - 1].recordedAt.getTime() -
        readings[0].recordedAt.getTime()) /
      (1000 * 60 * 60 * 24);

    const averageDaily = daysDiff > 0 ? totalUsage / daysDiff : 0;

    // Get next PM milestone for this asset and meter type
    const nextPM = await this.pmScheduleRepository.findOne({
      where: {
        assetId,
        isActive: true,
        meterType: meterType as string,
      },
      order: { nextMeterDue: 'ASC' },
    });

    let projectedNextMilestone: number | null = null;
    if (nextPM?.nextMeterDue && averageDaily > 0) {
      const remainingUsage = Number(nextPM.nextMeterDue) - lastReading;
      const daysUntilDue = remainingUsage / averageDaily;
      projectedNextMilestone = daysUntilDue;
    }

    return {
      averageDaily,
      totalUsage,
      readingCount: readings.length,
      projectedNextMilestone,
    };
  }

  /**
   * Bulk import meter readings
   */
  async bulkCreate(
    readings: CreateMeterReadingDto[],
    recordedById?: string,
  ): Promise<{ created: number; failed: number; errors: string[] }> {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const reading of readings) {
      try {
        await this.create(reading, recordedById);
        created++;
      } catch (error) {
        failed++;
        errors.push(
          `Asset ${reading.assetId}: ${error.message}`,
        );
      }
    }

    return { created, failed, errors };
  }
}
