import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SubscriptionPlanStatus, BillingCycle } from '@app/common/enums';
import { CompanySubscription } from './company-subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({
    type: 'enum',
    enum: SubscriptionPlanStatus,
    default: SubscriptionPlanStatus.ACTIVE,
  })
  status: SubscriptionPlanStatus;

  // Feature limits
  @Column({ type: 'int', default: 5 })
  maxUsers: number;

  @Column({ type: 'int', default: 100 })
  maxAssets: number;

  @Column({ type: 'int', default: 500 })
  maxWorkOrders: number;

  @Column({ type: 'int', default: 1000 })
  maxInventoryItems: number;

  @Column({ type: 'int', default: 5 }) // Storage in GB
  storageLimit: number;

  // Feature flags
  @Column({ type: 'jsonb', nullable: true })
  features: {
    apiAccess?: boolean;
    advancedReporting?: boolean;
    customBranding?: boolean;
    prioritySupport?: boolean;
    multiLocation?: boolean;
    integrations?: boolean;
    auditLogs?: boolean;
    customRoles?: boolean;
    [key: string]: boolean | undefined;
  };

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: false })
  isTrial: boolean;

  @Column({ type: 'int', default: 0 })
  trialDays: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => CompanySubscription, (subscription) => subscription.plan)
  subscriptions: CompanySubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
