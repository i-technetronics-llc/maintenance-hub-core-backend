import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionStatus } from '@app/common/enums';
import { Company } from './company.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('company_subscriptions')
export class CompanySubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { eager: true })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions, { eager: true })
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  // Usage tracking
  @Column({ type: 'int', default: 0 })
  currentUsers: number;

  @Column({ type: 'int', default: 0 })
  currentAssets: number;

  @Column({ type: 'int', default: 0 })
  currentWorkOrders: number;

  @Column({ type: 'int', default: 0 })
  currentInventoryItems: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  storageUsed: number;

  // Billing info
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastBillingDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
