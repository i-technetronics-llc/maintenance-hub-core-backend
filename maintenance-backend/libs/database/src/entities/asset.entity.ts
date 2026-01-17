import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AssetStatus } from '@app/common/enums';
import { Organization } from './organization.entity';
import { AssetLocation } from './asset-location.entity';

export enum AssetCriticality {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  CRITICAL = 5,
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  assetCode: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  category: string;

  // Hierarchical structure - parent-child relationships
  @Column({ type: 'uuid', nullable: true })
  parentAssetId: string;

  @ManyToOne(() => Asset, (asset) => asset.childAssets, { nullable: true })
  @JoinColumn({ name: 'parentAssetId' })
  parentAsset: Asset;

  @OneToMany(() => Asset, (asset) => asset.parentAsset)
  childAssets: Asset[];

  @Column({ type: 'int', default: 0 })
  hierarchyLevel: number; // 0 = top level, 1 = sub-system, 2 = component, etc.

  @Column({ nullable: true })
  hierarchyPath: string; // e.g., "/root-id/parent-id/this-id" for easy querying

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @ManyToOne(() => AssetLocation, { eager: false })
  @JoinColumn({ name: 'locationId' })
  location: AssetLocation;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Criticality rating (1-5 scale)
  @Column({
    type: 'enum',
    enum: AssetCriticality,
    default: AssetCriticality.MEDIUM,
  })
  criticality: AssetCriticality;

  @Column({ type: 'text', nullable: true })
  criticalityReason: string;

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE,
  })
  status: AssetStatus;

  @Column({ nullable: true })
  installedDate: Date;

  @Column({ nullable: true })
  warrantyExpiry: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ type: 'uuid', nullable: true })
  manufacturerId: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  serialNumber: string;

  // Barcode/QR code
  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  qrCode: string;

  // Financial information
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchasePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  currentValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  replacementCost: number;

  @Column({ nullable: true })
  depreciationMethod: string; // 'straight_line', 'reducing_balance'

  @Column({ type: 'int', nullable: true })
  usefulLifeYears: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  annualDepreciationRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salvageValue: number;

  // Maintenance info
  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate: Date;

  @Column({ type: 'date', nullable: true })
  nextMaintenanceDate: Date;

  @Column({ type: 'int', default: 0 })
  totalMaintenanceCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalMaintenanceCost: number;

  // Meter tracking
  @Column({ nullable: true })
  primaryMeterType: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  currentMeterReading: number;

  @Column({ nullable: true })
  meterUnit: string;

  // Additional metadata
  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
