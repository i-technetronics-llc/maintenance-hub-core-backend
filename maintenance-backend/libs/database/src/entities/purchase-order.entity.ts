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
import { Supplier } from './supplier.entity';
import { PurchaseRequisition } from './purchase-requisition.entity';
import { Organization } from './organization.entity';

export enum POStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SENT_TO_SUPPLIER = 'sent_to_supplier',
  ACKNOWLEDGED = 'acknowledged',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  INVOICED = 'invoiced',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  poNumber: string;

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ type: 'uuid', nullable: true })
  requisitionId: string;

  @ManyToOne(() => PurchaseRequisition)
  @JoinColumn({ name: 'requisitionId' })
  requisition: PurchaseRequisition;

  @Column({
    type: 'enum',
    enum: POStatus,
    default: POStatus.DRAFT,
  })
  status: POStatus;

  @Column({ type: 'date' })
  orderDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  paymentTerms: string;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  billingAddress: string;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid', nullable: true })
  approvedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder)
  items: PurchaseOrderItem[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'uuid', nullable: true })
  inventoryId: string;

  @Column({ type: 'uuid', nullable: true })
  requisitionItemId: string;

  @Column()
  itemName: string;

  @Column({ nullable: true })
  itemDescription: string;

  @Column({ nullable: true })
  partNumber: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  receivedQuantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
