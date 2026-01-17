import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrderPriority } from '@app/common/enums';
import { Asset } from './asset.entity';
import { Organization } from './organization.entity';

export enum PMTriggerType {
  TIME_BASED = 'time_based',
  METER_BASED = 'meter_based',
  CONDITION_BASED = 'condition_based',
  HYBRID = 'hybrid',
}

export enum PMFrequencyType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

@Entity('pm_schedules')
export class PMSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({
    type: 'enum',
    enum: PMTriggerType,
    default: PMTriggerType.TIME_BASED,
  })
  triggerType: PMTriggerType;

  // Time-based trigger fields
  @Column({
    type: 'enum',
    enum: PMFrequencyType,
    nullable: true,
  })
  frequencyType: PMFrequencyType;

  @Column({ type: 'int', nullable: true })
  frequencyValue: number; // e.g., every 2 weeks = frequencyType: WEEKLY, frequencyValue: 2

  @Column({ type: 'int', nullable: true })
  customDaysInterval: number; // for CUSTOM frequency type

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date;

  @Column({ type: 'date', nullable: true })
  lastCompletedDate: Date;

  // Meter-based trigger fields
  @Column({ nullable: true })
  meterType: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  meterInterval: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  lastMeterReading: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  nextMeterDue: number;

  // Condition-based trigger fields
  @Column({ type: 'jsonb', nullable: true })
  conditionRules: Array<{
    sensorType: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    unit: string;
  }>;

  // Work order generation settings
  @Column({ type: 'uuid', nullable: true })
  taskTemplateId: string;

  @Column({
    type: 'enum',
    enum: WorkOrderPriority,
    default: WorkOrderPriority.MEDIUM,
  })
  priority: WorkOrderPriority;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ type: 'jsonb', nullable: true })
  checklist: Array<{
    item: string;
    mandatory: boolean;
    order: number;
  }>;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @Column({ type: 'int', default: 0 })
  leadDays: number; // Days before due date to generate WO

  @Column({ type: 'int', default: 7 })
  overdueDaysThreshold: number; // Days after which to mark as overdue

  // Nested PM support
  @Column({ type: 'uuid', nullable: true })
  parentPmId: string;

  @Column({ type: 'uuid', array: true, nullable: true })
  triggersPmIds: string[]; // PMs triggered when this one completes

  // Organization
  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  completedCount: number;

  @Column({ type: 'int', default: 0 })
  missedCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
