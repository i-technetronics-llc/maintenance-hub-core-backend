import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { InventoryLocation } from './inventory-location.entity';
import { Organization } from './organization.entity';

export enum BatchStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  QUARANTINE = 'quarantine',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
}

@Entity('inventory_batches')
export class InventoryBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @ManyToOne(() => Inventory)
  @JoinColumn({ name: 'inventoryId' })
  inventory: Inventory;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  lotNumber: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ type: 'int', nullable: true })
  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  @Column({ type: 'date', nullable: true })
  manufactureDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @ManyToOne(() => InventoryLocation)
  @JoinColumn({ name: 'locationId' })
  location: InventoryLocation;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.AVAILABLE,
  })
  status: BatchStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ nullable: true })
  purchaseOrderNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'jsonb', nullable: true })
  qualityCheckData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
