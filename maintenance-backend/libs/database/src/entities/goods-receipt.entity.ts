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
import { PurchaseOrder } from './purchase-order.entity';
import { Organization } from './organization.entity';
import { InventoryLocation } from './inventory-location.entity';

export enum GRNStatus {
  DRAFT = 'draft',
  PENDING_INSPECTION = 'pending_inspection',
  INSPECTED = 'inspected',
  ACCEPTED = 'accepted',
  PARTIALLY_ACCEPTED = 'partially_accepted',
  REJECTED = 'rejected',
  PUT_AWAY = 'put_away',
}

@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  grnNumber: string;

  @Column({ type: 'uuid' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'uuid' })
  receivedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receivedById' })
  receivedBy: User;

  @Column({ type: 'date' })
  receivedDate: Date;

  @Column({
    type: 'enum',
    enum: GRNStatus,
    default: GRNStatus.DRAFT,
  })
  status: GRNStatus;

  @Column({ nullable: true })
  deliveryNoteNumber: string;

  @Column({ nullable: true })
  carrierName: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @ManyToOne(() => InventoryLocation)
  @JoinColumn({ name: 'locationId' })
  location: InventoryLocation;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  inspectionNotes: string;

  @Column({ type: 'uuid', nullable: true })
  inspectedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspectedById' })
  inspectedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  inspectedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => GoodsReceiptItem, (item) => item.goodsReceipt)
  items: GoodsReceiptItem[];

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('goods_receipt_items')
export class GoodsReceiptItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  goodsReceiptId: string;

  @ManyToOne(() => GoodsReceipt, (gr) => gr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goodsReceiptId' })
  goodsReceipt: GoodsReceipt;

  @Column({ type: 'uuid', nullable: true })
  purchaseOrderItemId: string;

  @Column({ type: 'uuid', nullable: true })
  inventoryId: string;

  @Column()
  itemName: string;

  @Column({ nullable: true })
  partNumber: string;

  @Column({ type: 'int' })
  orderedQuantity: number;

  @Column({ type: 'int' })
  receivedQuantity: number;

  @Column({ type: 'int', default: 0 })
  acceptedQuantity: number;

  @Column({ type: 'int', default: 0 })
  rejectedQuantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  lotNumber: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', nullable: true })
  inspectionNotes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
