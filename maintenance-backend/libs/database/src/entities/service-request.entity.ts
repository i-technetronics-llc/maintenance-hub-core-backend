import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CustomerAccount } from './customer-account.entity';
import { Company } from './company.entity';
import { AssetLocation } from './asset-location.entity';
import { Asset } from './asset.entity';
import { WorkOrder } from './work-order.entity';

export enum ServiceRequestStatus {
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ServiceRequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ServiceRequestCategory {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  MECHANICAL = 'mechanical',
  GENERAL = 'general',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  IT_SUPPORT = 'it_support',
  OTHER = 'other',
}

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  requestNumber: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => CustomerAccount)
  @JoinColumn({ name: 'customerId' })
  customer: CustomerAccount;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ServiceRequestCategory,
    default: ServiceRequestCategory.GENERAL,
  })
  category: ServiceRequestCategory;

  @Column({
    type: 'enum',
    enum: ServiceRequestPriority,
    default: ServiceRequestPriority.MEDIUM,
  })
  priority: ServiceRequestPriority;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @ManyToOne(() => AssetLocation, { nullable: true })
  @JoinColumn({ name: 'locationId' })
  location: AssetLocation;

  @Column({ type: 'uuid', nullable: true })
  assetId: string;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }>;

  @Column({
    type: 'enum',
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.SUBMITTED,
  })
  status: ServiceRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, { nullable: true })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'jsonb', nullable: true })
  comments: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorType: 'customer' | 'staff';
    message: string;
    createdAt: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  statusHistory: Array<{
    status: ServiceRequestStatus;
    changedAt: Date;
    changedBy: string;
    notes: string;
  }>;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ nullable: true })
  acknowledgedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ type: 'int', nullable: true })
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ nullable: true })
  ratedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @UpdateDateColumn()
  updatedAt: Date;
}
