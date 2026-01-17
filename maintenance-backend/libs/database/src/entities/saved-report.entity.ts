import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';

export enum ReportType {
  ASSET = 'asset',
  WORK_ORDER = 'work_order',
  INVENTORY = 'inventory',
  PREVENTIVE_MAINTENANCE = 'preventive_maintenance',
  COST = 'cost',
  PERFORMANCE = 'performance',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom',
}

export enum ReportScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

@Entity('saved_reports')
export class SavedReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType: ReportType;

  @Column({ type: 'jsonb' })
  configuration: {
    columns: string[];
    filters: Record<string, any>;
    sorting: { field: string; order: 'asc' | 'desc' }[];
    groupBy?: string[];
    aggregations?: { field: string; function: string }[];
    chartType?: string;
    dateRange?: { start: string; end: string };
  };

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ default: false })
  isPublic: boolean; // Shared within company

  @Column({ default: false })
  isScheduled: boolean;

  @Column({
    type: 'enum',
    enum: ReportScheduleFrequency,
    nullable: true,
  })
  scheduleFrequency: ReportScheduleFrequency;

  @Column({ type: 'text', array: true, nullable: true })
  scheduleRecipients: string[]; // Email addresses

  @Column({ type: 'time', nullable: true })
  scheduleTime: string;

  @Column({ type: 'int', nullable: true })
  scheduleDayOfWeek: number; // 0-6 for weekly

  @Column({ type: 'int', nullable: true })
  scheduleDayOfMonth: number; // 1-31 for monthly

  @Column({ type: 'timestamp', nullable: true })
  lastGeneratedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextScheduledAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
