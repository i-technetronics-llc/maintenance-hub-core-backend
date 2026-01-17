import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';

export enum TimeEntryStatus {
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

@Entity('work_order_time_entries')
export class WorkOrderTimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: TimeEntryStatus,
    default: TimeEntryStatus.IN_PROGRESS,
  })
  status: TimeEntryStatus;

  @Column({ nullable: true })
  activityType: string; // 'travel', 'work', 'break', 'waiting'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  laborCost: number;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
