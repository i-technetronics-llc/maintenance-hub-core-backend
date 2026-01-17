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

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILING = 'failing',
}

export enum WebhookEvent {
  WORK_ORDER_CREATED = 'work_order.created',
  WORK_ORDER_UPDATED = 'work_order.updated',
  WORK_ORDER_COMPLETED = 'work_order.completed',
  WORK_ORDER_CANCELLED = 'work_order.cancelled',
  ASSET_CREATED = 'asset.created',
  ASSET_UPDATED = 'asset.updated',
  ASSET_DELETED = 'asset.deleted',
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_UPDATED = 'inventory.updated',
  PM_GENERATED = 'pm.generated',
  PM_OVERDUE = 'pm.overdue',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
}

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.ACTIVE,
  })
  status: WebhookStatus;

  @Column({ type: 'enum', enum: WebhookEvent, array: true })
  events: WebhookEvent[];

  @Column({ nullable: true })
  secret: string; // For signature verification

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'int', default: 0 })
  consecutiveFailures: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSuccessAt: Date;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  webhookId: string;

  @ManyToOne(() => Webhook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhookId' })
  webhook: Webhook;

  @Column({
    type: 'enum',
    enum: WebhookEvent,
  })
  event: WebhookEvent;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  responseStatus: number;

  @Column({ type: 'text', nullable: true })
  responseBody: string;

  @Column({ type: 'int', nullable: true })
  responseTimeMs: number;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
