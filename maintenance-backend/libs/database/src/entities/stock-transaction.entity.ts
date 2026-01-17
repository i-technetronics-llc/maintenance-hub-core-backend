import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { InventoryLocation } from './inventory-location.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum StockTransactionType {
  RECEIPT = 'receipt',
  ISSUE = 'issue',
  TRANSFER = 'transfer',
  ADJUSTMENT_IN = 'adjustment_in',
  ADJUSTMENT_OUT = 'adjustment_out',
  RETURN = 'return',
  SCRAP = 'scrap',
  RESERVATION = 'reservation',
  UNRESERVATION = 'unreservation',
}

@Entity('stock_transactions')
export class StockTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transactionNumber: string;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @ManyToOne(() => Inventory)
  @JoinColumn({ name: 'inventoryId' })
  inventory: Inventory;

  @Column({
    type: 'enum',
    enum: StockTransactionType,
  })
  transactionType: StockTransactionType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', nullable: true })
  previousQuantity: number;

  @Column({ type: 'int', nullable: true })
  newQuantity: number;

  @Column({ type: 'uuid', nullable: true })
  fromLocationId: string;

  @ManyToOne(() => InventoryLocation)
  @JoinColumn({ name: 'fromLocationId' })
  fromLocation: InventoryLocation;

  @Column({ type: 'uuid', nullable: true })
  toLocationId: string;

  @ManyToOne(() => InventoryLocation)
  @JoinColumn({ name: 'toLocationId' })
  toLocation: InventoryLocation;

  @Column({ nullable: true })
  referenceType: string; // 'work_order', 'purchase_order', 'goods_receipt', 'manual'

  @Column({ type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCost: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  lotNumber: string;

  @Column({ type: 'uuid' })
  performedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
