import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum PRStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_ORDERED = 'partially_ordered',
  ORDERED = 'ordered',
  CANCELLED = 'cancelled',
}

@Entity('purchase_requisitions')
export class PurchaseRequisition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  prNumber: string;

  @Column({ type: 'uuid' })
  requestedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column({ nullable: true })
  department: string;

  @Column({
    type: 'enum',
    enum: PRStatus,
    default: PRStatus.DRAFT,
  })
  status: PRStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ type: 'text', nullable: true })
  justification: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'date', nullable: true })
  requiredByDate: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'uuid', nullable: true })
  workOrderId: string; // If related to a work order

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => PurchaseRequisitionItem, (item) => item.requisition)
  items: PurchaseRequisitionItem[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('purchase_requisition_items')
export class PurchaseRequisitionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requisitionId: string;

  @ManyToOne(() => PurchaseRequisition, (pr) => pr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requisitionId' })
  requisition: PurchaseRequisition;

  @Column({ type: 'uuid', nullable: true })
  inventoryId: string;

  @Column()
  itemName: string;

  @Column({ nullable: true })
  itemDescription: string;

  @Column({ nullable: true })
  partNumber: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedUnitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedTotalPrice: number;

  @Column({ type: 'uuid', nullable: true })
  preferredSupplierId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', default: 0 })
  orderedQuantity: number;

  @CreateDateColumn()
  createdAt: Date;
}
