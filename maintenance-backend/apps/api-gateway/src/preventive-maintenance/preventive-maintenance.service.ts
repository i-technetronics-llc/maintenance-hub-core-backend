import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PMSchedule, PMTriggerType, PMFrequencyType } from '@app/database/entities/pm-schedule.entity';
import { PMExecutionHistory, PMExecutionStatus } from '@app/database/entities/pm-execution-history.entity';
import { PMTask } from '@app/database/entities/pm-task.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { MeterReading } from '@app/database/entities/meter-reading.entity';
import { WorkOrderStatus, WorkOrderType, WorkOrderPriority } from '@app/common/enums';
import { CreatePMScheduleDto, UpdatePMScheduleDto } from './dto';

@Injectable()
export class PreventiveMaintenanceService {
  private readonly logger = new Logger(PreventiveMaintenanceService.name);

  constructor(
    @InjectRepository(PMSchedule)
    private pmScheduleRepository: Repository<PMSchedule>,
    @InjectRepository(PMExecutionHistory)
    private pmExecutionHistoryRepository: Repository<PMExecutionHistory>,
    @InjectRepository(PMTask)
    private pmTaskRepository: Repository<PMTask>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(MeterReading)
    private meterReadingRepository: Repository<MeterReading>,
  ) {}

  async create(createDto: CreatePMScheduleDto): Promise<PMSchedule> {
    // Validate asset exists
    const asset = await this.assetRepository.findOne({
      where: { id: createDto.assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID '${createDto.assetId}' not found`);
    }

    // Calculate next due date based on trigger type
    const nextDueDate = this.calculateNextDueDate(createDto);

    // For meter-based PMs, initialize nextMeterDue
    let nextMeterDue: number | undefined;
    if (
      (createDto.triggerType === PMTriggerType.METER_BASED ||
        createDto.triggerType === PMTriggerType.HYBRID) &&
      createDto.meterInterval
    ) {
      const currentReading = createDto.lastMeterReading || asset.currentMeterReading || 0;
      nextMeterDue = Number(currentReading) + Number(createDto.meterInterval);
    }

    const pmSchedule = this.pmScheduleRepository.create({
      ...createDto,
      nextDueDate,
      nextMeterDue,
      organizationId: createDto.organizationId || asset.organizationId,
    });

    return await this.pmScheduleRepository.save(pmSchedule);
  }

  async findAll(organizationId?: string): Promise<PMSchedule[]> {
    const whereClause: any = {};
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    return await this.pmScheduleRepository.find({
      where: whereClause,
      relations: ['asset', 'organization'],
      order: { nextDueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PMSchedule> {
    const pmSchedule = await this.pmScheduleRepository.findOne({
      where: { id },
      relations: ['asset', 'organization'],
    });

    if (!pmSchedule) {
      throw new NotFoundException(`PM Schedule with ID '${id}' not found`);
    }

    return pmSchedule;
  }

  async update(id: string, updateDto: UpdatePMScheduleDto): Promise<PMSchedule> {
    const pmSchedule = await this.findOne(id);

    // Recalculate next due date if trigger settings changed
    if (
      updateDto.triggerType ||
      updateDto.frequencyType ||
      updateDto.frequencyValue ||
      updateDto.meterInterval
    ) {
      const mergedDto = { ...pmSchedule, ...updateDto };
      const nextDueDate = this.calculateNextDueDate(mergedDto as any);
      updateDto['nextDueDate'] = nextDueDate;

      // Update nextMeterDue if meter interval changed
      if (updateDto.meterInterval) {
        const currentReading = updateDto.lastMeterReading || pmSchedule.lastMeterReading || 0;
        updateDto['nextMeterDue'] = Number(currentReading) + Number(updateDto.meterInterval);
      }
    }

    Object.assign(pmSchedule, updateDto);
    return await this.pmScheduleRepository.save(pmSchedule);
  }

  async remove(id: string): Promise<void> {
    const pmSchedule = await this.findOne(id);
    await this.pmScheduleRepository.remove(pmSchedule);
  }

  async getOverduePMs(organizationId?: string): Promise<PMSchedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereClause: any = {
      isActive: true,
      nextDueDate: LessThanOrEqual(today),
    };

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    return await this.pmScheduleRepository.find({
      where: whereClause,
      relations: ['asset'],
      order: { nextDueDate: 'ASC' },
    });
  }

  async getUpcomingPMs(days: number = 7, organizationId?: string): Promise<PMSchedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    futureDate.setHours(23, 59, 59, 999);

    const whereClause: any = {
      isActive: true,
      nextDueDate: MoreThanOrEqual(today),
    };

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const pms = await this.pmScheduleRepository.find({
      where: whereClause,
      relations: ['asset'],
      order: { nextDueDate: 'ASC' },
    });

    return pms.filter((pm) => pm.nextDueDate <= futureDate);
  }

  async getComplianceMetrics(organizationId?: string): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    completedOnTime: number;
    completedLate: number;
    missed: number;
    complianceRate: number;
  }> {
    const whereClause: any = {};
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const totalSchedules = await this.pmScheduleRepository.count({ where: whereClause });
    const activeSchedules = await this.pmScheduleRepository.count({
      where: { ...whereClause, isActive: true },
    });

    // Get execution history stats
    const executions = await this.pmExecutionHistoryRepository
      .createQueryBuilder('exec')
      .leftJoin('exec.pmSchedule', 'schedule')
      .select('exec.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(organizationId ? 'schedule.organizationId = :organizationId' : '1=1', {
        organizationId,
      })
      .groupBy('exec.status')
      .getRawMany();

    const stats = executions.reduce(
      (acc, row) => {
        acc[row.status] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    const completedOnTime = stats[PMExecutionStatus.COMPLETED] || 0;
    const completedLate = stats[PMExecutionStatus.COMPLETED_LATE] || 0;
    const missed = stats[PMExecutionStatus.MISSED] || 0;
    const total = completedOnTime + completedLate + missed;

    return {
      totalSchedules,
      activeSchedules,
      completedOnTime,
      completedLate,
      missed,
      complianceRate: total > 0 ? ((completedOnTime + completedLate) / total) * 100 : 100,
    };
  }

  async generateWorkOrder(pmScheduleId: string): Promise<WorkOrder> {
    const pmSchedule = await this.findOne(pmScheduleId);

    if (!pmSchedule.isActive) {
      throw new BadRequestException('Cannot generate work order for inactive PM schedule');
    }

    // Generate unique WO number
    const woNumber = `PM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const workOrder = this.workOrderRepository.create({
      woNumber,
      title: `PM: ${pmSchedule.name}`,
      description: pmSchedule.description || `Preventive maintenance for asset`,
      type: WorkOrderType.PREVENTIVE,
      priority: pmSchedule.priority || WorkOrderPriority.MEDIUM,
      status: WorkOrderStatus.PENDING_APPROVAL,
      assetId: pmSchedule.assetId,
      assignedToId: pmSchedule.assignedToId,
      scheduledDate: pmSchedule.nextDueDate,
      dueDate: this.calculateDueDate(pmSchedule.nextDueDate, pmSchedule.overdueDaysThreshold),
      checklist: pmSchedule.checklist,
      estimatedCost: null,
    });

    const savedWO = await this.workOrderRepository.save(workOrder);

    // Create execution history
    const execution = this.pmExecutionHistoryRepository.create({
      pmScheduleId: pmSchedule.id,
      workOrderId: savedWO.id,
      scheduledDate: pmSchedule.nextDueDate,
      status: PMExecutionStatus.GENERATED,
    });
    await this.pmExecutionHistoryRepository.save(execution);

    // Update PM schedule
    pmSchedule.lastCompletedDate = new Date();
    pmSchedule.nextDueDate = this.calculateNextDueDate(pmSchedule as any);
    await this.pmScheduleRepository.save(pmSchedule);

    this.logger.log(`Generated work order ${savedWO.woNumber} for PM schedule ${pmSchedule.name}`);

    return savedWO;
  }

  /**
   * Generate work order triggered by meter reading threshold
   */
  async generateWorkOrderForMeterTrigger(
    pmScheduleId: string,
    currentMeterReading: number,
  ): Promise<WorkOrder> {
    const pmSchedule = await this.findOne(pmScheduleId);

    if (!pmSchedule.isActive) {
      throw new BadRequestException('Cannot generate work order for inactive PM schedule');
    }

    // Check if a work order was already generated for this meter threshold
    const recentExecution = await this.pmExecutionHistoryRepository.findOne({
      where: {
        pmScheduleId: pmSchedule.id,
      },
      order: { createdAt: 'DESC' },
    });

    // Prevent duplicate WO generation within a small window
    if (recentExecution) {
      const hoursSinceLastExecution =
        (Date.now() - recentExecution.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastExecution < 1) {
        this.logger.warn(
          `Skipping meter-triggered WO for PM ${pmScheduleId} - recent execution exists`,
        );
        throw new BadRequestException('Work order was recently generated for this PM schedule');
      }
    }

    // Generate unique WO number with meter indicator
    const woNumber = `PM-MTR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const workOrder = this.workOrderRepository.create({
      woNumber,
      title: `PM (Meter Triggered): ${pmSchedule.name}`,
      description:
        `${pmSchedule.description || 'Preventive maintenance'}\n\n` +
        `Triggered by meter reading: ${currentMeterReading} ${pmSchedule.meterType || ''}`,
      type: WorkOrderType.PREVENTIVE,
      priority: pmSchedule.priority || WorkOrderPriority.MEDIUM,
      status: WorkOrderStatus.PENDING_APPROVAL,
      assetId: pmSchedule.assetId,
      assignedToId: pmSchedule.assignedToId,
      scheduledDate: new Date(),
      dueDate: this.calculateDueDate(new Date(), pmSchedule.overdueDaysThreshold),
      checklist: pmSchedule.checklist,
      estimatedCost: null,
    });

    const savedWO = await this.workOrderRepository.save(workOrder);

    // Create execution history with meter info
    const execution = this.pmExecutionHistoryRepository.create({
      pmScheduleId: pmSchedule.id,
      workOrderId: savedWO.id,
      scheduledDate: new Date(),
      status: PMExecutionStatus.GENERATED,
      metadata: {
        triggerType: 'meter_based',
        meterReading: currentMeterReading,
        meterType: pmSchedule.meterType,
        nextMeterDue: pmSchedule.nextMeterDue,
      },
    });
    await this.pmExecutionHistoryRepository.save(execution);

    this.logger.log(
      `Generated meter-triggered work order ${savedWO.woNumber} for PM schedule ${pmSchedule.name} ` +
        `at meter reading ${currentMeterReading}`,
    );

    return savedWO;
  }

  /**
   * Generate work order triggered by condition rules
   */
  async generateWorkOrderForConditionTrigger(
    pmScheduleId: string,
    triggeredConditions: Array<{
      sensorType: string;
      currentValue: number;
      threshold: number;
      operator: string;
    }>,
  ): Promise<WorkOrder> {
    const pmSchedule = await this.findOne(pmScheduleId);

    if (!pmSchedule.isActive) {
      throw new BadRequestException('Cannot generate work order for inactive PM schedule');
    }

    // Generate unique WO number with condition indicator
    const woNumber = `PM-CND-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const conditionDetails = triggeredConditions
      .map(
        (c) =>
          `${c.sensorType}: ${c.currentValue} ${c.operator} ${c.threshold}`,
      )
      .join('\n');

    const workOrder = this.workOrderRepository.create({
      woNumber,
      title: `PM (Condition Triggered): ${pmSchedule.name}`,
      description:
        `${pmSchedule.description || 'Preventive maintenance'}\n\n` +
        `Triggered by conditions:\n${conditionDetails}`,
      type: WorkOrderType.PREDICTIVE, // Condition-based is often considered predictive
      priority: pmSchedule.priority || WorkOrderPriority.HIGH, // Condition triggers often indicate urgency
      status: WorkOrderStatus.PENDING_APPROVAL,
      assetId: pmSchedule.assetId,
      assignedToId: pmSchedule.assignedToId,
      scheduledDate: new Date(),
      dueDate: this.calculateDueDate(new Date(), Math.min(pmSchedule.overdueDaysThreshold, 3)), // Shorter due for conditions
      checklist: pmSchedule.checklist,
      estimatedCost: null,
    });

    const savedWO = await this.workOrderRepository.save(workOrder);

    // Create execution history with condition info
    const execution = this.pmExecutionHistoryRepository.create({
      pmScheduleId: pmSchedule.id,
      workOrderId: savedWO.id,
      scheduledDate: new Date(),
      status: PMExecutionStatus.GENERATED,
      metadata: {
        triggerType: 'condition_based',
        triggeredConditions,
      },
    });
    await this.pmExecutionHistoryRepository.save(execution);

    this.logger.log(
      `Generated condition-triggered work order ${savedWO.woNumber} for PM schedule ${pmSchedule.name}`,
    );

    return savedWO;
  }

  /**
   * Process all meter-based PM schedules
   * Called by cron job and can also be triggered manually
   */
  async processMeterBasedPMs(): Promise<{
    processed: number;
    triggered: number;
    errors: string[];
  }> {
    this.logger.log('Processing meter-based preventive maintenance...');

    const meterBasedPMs = await this.pmScheduleRepository.find({
      where: [
        { isActive: true, triggerType: PMTriggerType.METER_BASED },
        { isActive: true, triggerType: PMTriggerType.HYBRID },
      ],
      relations: ['asset'],
    });

    let processed = 0;
    let triggered = 0;
    const errors: string[] = [];

    for (const pm of meterBasedPMs) {
      try {
        processed++;

        if (!pm.meterType || !pm.nextMeterDue || !pm.meterInterval) {
          continue;
        }

        // Get the latest meter reading for this asset and meter type
        const latestReading = await this.meterReadingRepository.findOne({
          where: {
            assetId: pm.assetId,
            meterType: pm.meterType as any,
          },
          order: { recordedAt: 'DESC' },
        });

        if (!latestReading) {
          continue;
        }

        const currentReading = Number(latestReading.readingValue);
        const nextMeterDue = Number(pm.nextMeterDue);

        // Check if current reading has reached or exceeded the threshold
        if (currentReading >= nextMeterDue) {
          // Check if a WO was already generated recently for this PM
          const recentExecution = await this.pmExecutionHistoryRepository.findOne({
            where: { pmScheduleId: pm.id },
            order: { createdAt: 'DESC' },
          });

          // Skip if WO was generated in the last 24 hours for meter-based
          if (recentExecution) {
            const hoursSinceLast =
              (Date.now() - recentExecution.createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLast < 24) {
              continue;
            }
          }

          await this.generateWorkOrderForMeterTrigger(pm.id, currentReading);

          // Update the PM schedule
          pm.lastMeterReading = currentReading;
          pm.nextMeterDue = currentReading + Number(pm.meterInterval);
          await this.pmScheduleRepository.save(pm);

          triggered++;
          this.logger.log(
            `Meter-based PM triggered for ${pm.name} at reading ${currentReading}`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to process meter-based PM ${pm.id}: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    this.logger.log(
      `Completed meter-based PM processing. Processed: ${processed}, Triggered: ${triggered}`,
    );

    return { processed, triggered, errors };
  }

  /**
   * Process all condition-based PM schedules
   * This method evaluates condition rules against current sensor/meter data
   */
  async processConditionBasedPMs(): Promise<{
    processed: number;
    triggered: number;
    errors: string[];
  }> {
    this.logger.log('Processing condition-based preventive maintenance...');

    const conditionBasedPMs = await this.pmScheduleRepository.find({
      where: [
        { isActive: true, triggerType: PMTriggerType.CONDITION_BASED },
        { isActive: true, triggerType: PMTriggerType.HYBRID },
      ],
      relations: ['asset'],
    });

    let processed = 0;
    let triggered = 0;
    const errors: string[] = [];

    for (const pm of conditionBasedPMs) {
      try {
        processed++;

        if (!pm.conditionRules || pm.conditionRules.length === 0) {
          continue;
        }

        const triggeredConditions: Array<{
          sensorType: string;
          currentValue: number;
          threshold: number;
          operator: string;
        }> = [];

        // Evaluate each condition rule
        for (const rule of pm.conditionRules) {
          // Get the latest reading for this sensor type
          const latestReading = await this.meterReadingRepository.findOne({
            where: {
              assetId: pm.assetId,
              meterType: rule.sensorType as any,
            },
            order: { recordedAt: 'DESC' },
          });

          if (!latestReading) {
            continue;
          }

          const currentValue = Number(latestReading.readingValue);
          const threshold = rule.threshold;
          let conditionMet = false;

          // Evaluate the condition based on operator
          switch (rule.operator) {
            case 'gt':
              conditionMet = currentValue > threshold;
              break;
            case 'gte':
              conditionMet = currentValue >= threshold;
              break;
            case 'lt':
              conditionMet = currentValue < threshold;
              break;
            case 'lte':
              conditionMet = currentValue <= threshold;
              break;
            case 'eq':
              conditionMet = currentValue === threshold;
              break;
            default:
              this.logger.warn(`Unknown operator: ${rule.operator}`);
          }

          if (conditionMet) {
            triggeredConditions.push({
              sensorType: rule.sensorType,
              currentValue,
              threshold,
              operator: rule.operator,
            });
          }
        }

        // If any conditions are triggered, generate a work order
        if (triggeredConditions.length > 0) {
          // Check if a WO was already generated recently for this PM
          const recentExecution = await this.pmExecutionHistoryRepository.findOne({
            where: { pmScheduleId: pm.id },
            order: { createdAt: 'DESC' },
          });

          // Skip if WO was generated in the last 4 hours for condition-based
          // (shorter window since conditions can indicate urgent issues)
          if (recentExecution) {
            const hoursSinceLast =
              (Date.now() - recentExecution.createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLast < 4) {
              continue;
            }
          }

          await this.generateWorkOrderForConditionTrigger(pm.id, triggeredConditions);
          triggered++;

          this.logger.log(
            `Condition-based PM triggered for ${pm.name}: ${triggeredConditions.length} conditions met`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to process condition-based PM ${pm.id}: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    this.logger.log(
      `Completed condition-based PM processing. Processed: ${processed}, Triggered: ${triggered}`,
    );

    return { processed, triggered, errors };
  }

  /**
   * Main cron job for processing time-based PMs
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processScheduledPMs(): Promise<void> {
    this.logger.log('Processing scheduled preventive maintenance...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find time-based PM schedules due for generation (considering lead days)
    const duePMs = await this.pmScheduleRepository
      .createQueryBuilder('pm')
      .where('pm.isActive = :isActive', { isActive: true })
      .andWhere('pm.triggerType IN (:...types)', {
        types: [PMTriggerType.TIME_BASED, PMTriggerType.HYBRID],
      })
      .andWhere("DATE(pm.nextDueDate) - pm.leadDays <= DATE(:today)", { today })
      .getMany();

    for (const pm of duePMs) {
      try {
        // Check if work order already exists for this due date
        const existingExecution = await this.pmExecutionHistoryRepository.findOne({
          where: {
            pmScheduleId: pm.id,
            scheduledDate: pm.nextDueDate,
          },
        });

        if (!existingExecution) {
          await this.generateWorkOrder(pm.id);
          this.logger.log(`Auto-generated work order for time-based PM: ${pm.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to generate WO for PM ${pm.id}: ${error.message}`);
      }
    }

    this.logger.log('Completed processing time-based preventive maintenance');
  }

  /**
   * Cron job for processing meter-based PMs
   * Runs every hour to check meter readings against thresholds
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processMeterBasedPMsCron(): Promise<void> {
    await this.processMeterBasedPMs();
  }

  /**
   * Cron job for processing condition-based PMs
   * Runs every 30 minutes to check conditions
   */
  @Cron('0 */30 * * * *') // Every 30 minutes
  async processConditionBasedPMsCron(): Promise<void> {
    await this.processConditionBasedPMs();
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkOverduePMs(): Promise<void> {
    this.logger.log('Checking for overdue preventive maintenance...');

    const overduePMs = await this.getOverduePMs();

    for (const pm of overduePMs) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(pm.nextDueDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysOverdue > pm.overdueDaysThreshold) {
        pm.missedCount += 1;
        await this.pmScheduleRepository.save(pm);

        // Update execution history if exists
        const execution = await this.pmExecutionHistoryRepository.findOne({
          where: {
            pmScheduleId: pm.id,
            scheduledDate: pm.nextDueDate,
          },
        });

        if (execution && execution.status !== PMExecutionStatus.COMPLETED) {
          execution.status = PMExecutionStatus.MISSED;
          execution.daysOverdue = daysOverdue;
          await this.pmExecutionHistoryRepository.save(execution);
        }

        this.logger.warn(`PM Schedule ${pm.name} is ${daysOverdue} days overdue`);
      }
    }

    this.logger.log('Completed checking overdue preventive maintenance');
  }

  /**
   * Get meter-based PM schedules approaching threshold
   */
  async getMeterBasedPMsApproachingDue(
    thresholdPercentage: number = 90,
    organizationId?: string,
  ): Promise<
    Array<{
      pmSchedule: PMSchedule;
      currentReading: number;
      nextDue: number;
      percentageToThreshold: number;
    }>
  > {
    const whereClause: any = [
      { isActive: true, triggerType: PMTriggerType.METER_BASED },
      { isActive: true, triggerType: PMTriggerType.HYBRID },
    ];

    if (organizationId) {
      whereClause.forEach((w: any) => (w.organizationId = organizationId));
    }

    const meterBasedPMs = await this.pmScheduleRepository.find({
      where: whereClause,
      relations: ['asset'],
    });

    const results: Array<{
      pmSchedule: PMSchedule;
      currentReading: number;
      nextDue: number;
      percentageToThreshold: number;
    }> = [];

    for (const pm of meterBasedPMs) {
      if (!pm.meterType || !pm.nextMeterDue || !pm.meterInterval) {
        continue;
      }

      const latestReading = await this.meterReadingRepository.findOne({
        where: {
          assetId: pm.assetId,
          meterType: pm.meterType as any,
        },
        order: { recordedAt: 'DESC' },
      });

      if (!latestReading) {
        continue;
      }

      const currentReading = Number(latestReading.readingValue);
      const lastMeterReading = Number(pm.lastMeterReading || 0);
      const nextDue = Number(pm.nextMeterDue);
      const interval = Number(pm.meterInterval);

      // Calculate percentage progress toward threshold
      const progress = currentReading - lastMeterReading;
      const percentageToThreshold = (progress / interval) * 100;

      if (percentageToThreshold >= thresholdPercentage) {
        results.push({
          pmSchedule: pm,
          currentReading,
          nextDue,
          percentageToThreshold,
        });
      }
    }

    return results.sort((a, b) => b.percentageToThreshold - a.percentageToThreshold);
  }

  private calculateNextDueDate(dto: CreatePMScheduleDto | PMSchedule): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dto.triggerType === PMTriggerType.TIME_BASED || dto.triggerType === PMTriggerType.HYBRID) {
      const baseDate = dto['startDate'] ? new Date(dto['startDate']) : today;

      switch (dto.frequencyType) {
        case PMFrequencyType.DAILY:
          baseDate.setDate(baseDate.getDate() + (dto.frequencyValue || 1));
          break;
        case PMFrequencyType.WEEKLY:
          baseDate.setDate(baseDate.getDate() + (dto.frequencyValue || 1) * 7);
          break;
        case PMFrequencyType.BIWEEKLY:
          baseDate.setDate(baseDate.getDate() + 14);
          break;
        case PMFrequencyType.MONTHLY:
          baseDate.setMonth(baseDate.getMonth() + (dto.frequencyValue || 1));
          break;
        case PMFrequencyType.QUARTERLY:
          baseDate.setMonth(baseDate.getMonth() + 3);
          break;
        case PMFrequencyType.SEMI_ANNUALLY:
          baseDate.setMonth(baseDate.getMonth() + 6);
          break;
        case PMFrequencyType.YEARLY:
          baseDate.setFullYear(baseDate.getFullYear() + (dto.frequencyValue || 1));
          break;
        case PMFrequencyType.CUSTOM:
          baseDate.setDate(baseDate.getDate() + (dto.customDaysInterval || 30));
          break;
        default:
          baseDate.setMonth(baseDate.getMonth() + 1);
      }

      return baseDate;
    }

    // For meter-based only, return far future date (PM is triggered by meter, not time)
    if (dto.triggerType === PMTriggerType.METER_BASED) {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);
      return farFuture;
    }

    // For condition-based only, return far future date (PM is triggered by conditions, not time)
    if (dto.triggerType === PMTriggerType.CONDITION_BASED) {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);
      return farFuture;
    }

    return today;
  }

  private calculateDueDate(scheduledDate: Date, overdueDays: number): Date {
    const dueDate = new Date(scheduledDate);
    dueDate.setDate(dueDate.getDate() + overdueDays);
    return dueDate;
  }

  // PM Task Library methods
  async createTask(taskData: Partial<PMTask>): Promise<PMTask> {
    const task = this.pmTaskRepository.create(taskData);
    return await this.pmTaskRepository.save(task);
  }

  async findAllTasks(organizationId?: string): Promise<PMTask[]> {
    const whereClause: any = { isActive: true };
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }
    return await this.pmTaskRepository.find({
      where: whereClause,
      order: { name: 'ASC' },
    });
  }

  async findTask(id: string): Promise<PMTask> {
    const task = await this.pmTaskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`PM Task with ID '${id}' not found`);
    }
    return task;
  }

  async updateTask(id: string, updateData: Partial<PMTask>): Promise<PMTask> {
    const task = await this.findTask(id);
    Object.assign(task, updateData);
    return await this.pmTaskRepository.save(task);
  }

  async removeTask(id: string): Promise<void> {
    const task = await this.findTask(id);
    await this.pmTaskRepository.remove(task);
  }

  // Execution History methods
  async getExecutionHistory(
    pmScheduleId: string,
    limit: number = 50,
  ): Promise<PMExecutionHistory[]> {
    return await this.pmExecutionHistoryRepository.find({
      where: { pmScheduleId },
      relations: ['workOrder'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markExecutionCompleted(
    executionId: string,
    completedDate?: Date,
  ): Promise<PMExecutionHistory> {
    const execution = await this.pmExecutionHistoryRepository.findOne({
      where: { id: executionId },
      relations: ['pmSchedule'],
    });

    if (!execution) {
      throw new NotFoundException(`Execution with ID '${executionId}' not found`);
    }

    const completed = completedDate || new Date();
    const scheduled = new Date(execution.scheduledDate);
    const daysLate = Math.floor((completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));

    execution.completedDate = completed;
    execution.status =
      daysLate > (execution.pmSchedule?.overdueDaysThreshold || 7)
        ? PMExecutionStatus.COMPLETED_LATE
        : PMExecutionStatus.COMPLETED;
    execution.daysOverdue = daysLate > 0 ? daysLate : 0;

    // Update PM schedule stats
    if (execution.pmSchedule) {
      execution.pmSchedule.completedCount += 1;
      execution.pmSchedule.lastCompletedDate = completed;
      await this.pmScheduleRepository.save(execution.pmSchedule);
    }

    return await this.pmExecutionHistoryRepository.save(execution);
  }
}
