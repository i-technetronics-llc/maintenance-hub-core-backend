import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PMSchedule } from './pm-schedule.entity';
import { WorkOrder } from './work-order.entity';

export enum PMExecutionStatus {
  GENERATED = 'generated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  COMPLETED_LATE = 'completed_late',
  MISSED = 'missed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

@Entity('pm_execution_history')
export class PMExecutionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pmScheduleId: string;

  @ManyToOne(() => PMSchedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pmScheduleId' })
  pmSchedule: PMSchedule;

  @Column({ type: 'uuid', nullable: true })
  workOrderId: string;

  @ManyToOne(() => WorkOrder)
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({
    type: 'enum',
    enum: PMExecutionStatus,
    default: PMExecutionStatus.GENERATED,
  })
  status: PMExecutionStatus;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  meterReadingAtExecution: number;

  @Column({ type: 'int', nullable: true })
  daysOverdue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  skipReason: string;

  @Column({ type: 'jsonb', nullable: true })
  executionDetails: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
