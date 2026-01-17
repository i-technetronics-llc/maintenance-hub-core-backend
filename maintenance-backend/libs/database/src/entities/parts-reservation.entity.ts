import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { Inventory } from './inventory.entity';
import { User } from './user.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

@Entity('parts_reservations')
export class PartsReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @ManyToOne(() => Inventory)
  @JoinColumn({ name: 'inventoryId' })
  inventory: Inventory;

  @Column({ type: 'int' })
  requestedQuantity: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ type: 'int', default: 0 })
  issuedQuantity: number;

  @Column({ type: 'int', default: 0 })
  returnedQuantity: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'uuid', nullable: true })
  reservedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reservedById' })
  reservedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  reservedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  fulfilledAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
