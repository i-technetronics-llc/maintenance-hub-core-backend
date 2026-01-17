import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IntegrationConfig } from './integration-config.entity';

export enum SyncOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('sync_queue')
export class SyncQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  integrationId: string;

  @ManyToOne(() => IntegrationConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integrationId' })
  integration: IntegrationConfig;

  @Column({
    type: 'enum',
    enum: SyncOperation,
  })
  operation: SyncOperation;

  // Type of entity: asset, inventory, work_order, purchase_order
  @Column()
  entityType: string;

  // ID of the entity in our system
  @Column({ type: 'uuid' })
  entityId: string;

  // The data payload to sync
  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.PENDING,
  })
  status: QueueStatus;

  // Number of retry attempts
  @Column({ type: 'int', default: 0 })
  retryCount: number;

  // Maximum number of retries allowed
  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  // Scheduled time for this sync operation
  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  // Time when processing started
  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  // Time when processing completed
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  // Error message if failed
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // Error details
  @Column({ type: 'jsonb', nullable: true })
  errorDetails: Record<string, any>;

  // Priority level (lower number = higher priority)
  @Column({ type: 'int', default: 5 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
