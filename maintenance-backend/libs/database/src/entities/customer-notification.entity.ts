import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerAccount } from './customer-account.entity';
import { ServiceRequest } from './service-request.entity';

export enum CustomerNotificationType {
  REQUEST_SUBMITTED = 'request_submitted',
  REQUEST_ACKNOWLEDGED = 'request_acknowledged',
  REQUEST_IN_PROGRESS = 'request_in_progress',
  REQUEST_COMPLETED = 'request_completed',
  REQUEST_CANCELLED = 'request_cancelled',
  COMMENT_ADDED = 'comment_added',
  WORK_ORDER_ASSIGNED = 'work_order_assigned',
  RATING_REQUESTED = 'rating_requested',
  GENERAL = 'general',
}

@Entity('customer_notifications')
export class CustomerNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => CustomerAccount)
  @JoinColumn({ name: 'customerId' })
  customer: CustomerAccount;

  @Column({ type: 'uuid', nullable: true })
  requestId: string;

  @ManyToOne(() => ServiceRequest, { nullable: true })
  @JoinColumn({ name: 'requestId' })
  request: ServiceRequest;

  @Column({
    type: 'enum',
    enum: CustomerNotificationType,
    default: CustomerNotificationType.GENERAL,
  })
  type: CustomerNotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
