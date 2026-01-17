import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryStatus, InventoryCategory } from '@app/common/enums';
import { Organization } from './organization.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: InventoryCategory,
    default: InventoryCategory.OTHER,
  })
  category: InventoryCategory;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  minQuantity: number;

  @Column({ type: 'int', default: 100 })
  maxQuantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  partNumber: string;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.ACTIVE,
  })
  status: InventoryStatus;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({ nullable: true })
  lastRestockDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
