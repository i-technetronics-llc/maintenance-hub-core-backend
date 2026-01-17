import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Client } from './client.entity';

export enum SLAStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export enum SLACategory {
  POWER_AVAILABILITY = 'power_availability',
  PPM_COMPLETION = 'ppm_completion',
  CMC_COMPLETION = 'cmc_completion',
  GRID_PERFORMANCE = 'grid_performance',
  GRID_FAULT_MAINTENANCE = 'grid_fault_maintenance',
  GENERAL_HOUSEKEEPING = 'general_housekeeping',
  RESPONSE_TIME = 'response_time',
  RESOLUTION_TIME = 'resolution_time',
  UPTIME = 'uptime',
  OTHER = 'other',
}

export enum SLAMetricUnit {
  PERCENTAGE = 'percentage',
  HOURS = 'hours',
  DAYS = 'days',
  MINUTES = 'minutes',
}

@Entity('slas')
export class SLA {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SLACategory,
    default: SLACategory.OTHER,
  })
  category: SLACategory;

  @Column({
    type: 'enum',
    enum: SLAStatus,
    default: SLAStatus.ACTIVE,
  })
  status: SLAStatus;

  // Target metrics
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  targetValue: number;

  @Column({
    type: 'enum',
    enum: SLAMetricUnit,
    default: SLAMetricUnit.PERCENTAGE,
  })
  metricUnit: SLAMetricUnit;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  warningThreshold: number; // Alert when approaching target

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  criticalThreshold: number; // Critical alert threshold

  // Penalty and escalation
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  penaltyPercentage: number;

  @Column({ type: 'int', nullable: true })
  escalationDays: number;

  // Time-based settings
  @Column({ type: 'int', nullable: true })
  responseTimeHours: number;

  @Column({ type: 'int', nullable: true })
  resolutionTimeHours: number;

  // Sub-items for detailed SLA breakdown
  @Column({ type: 'jsonb', nullable: true })
  subItems: Array<{
    name: string;
    description?: string;
    targetValue?: number;
    metricUnit?: SLAMetricUnit;
    isRequired: boolean;
  }>;

  // Priority-based response times
  @Column({ type: 'jsonb', nullable: true })
  priorityResponseTimes: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };

  // Working hours configuration
  @Column({ type: 'jsonb', nullable: true })
  workingHours: {
    startTime: string;
    endTime: string;
    workingDays: number[]; // 0=Sunday, 1=Monday, etc.
    excludeHolidays: boolean;
  };

  // Relations
  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Validity period
  @Column({ type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
