import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { User } from './user.entity';

export enum AssetHistoryEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  MAINTENANCE_PERFORMED = 'maintenance_performed',
  MAINTENANCE_SCHEDULED = 'maintenance_scheduled',
  STATUS_CHANGED = 'status_changed',
  LOCATION_CHANGED = 'location_changed',
  METER_READING = 'meter_reading',
  INSPECTION = 'inspection',
  REPAIR = 'repair',
  REPLACEMENT = 'replacement',
  CALIBRATION = 'calibration',
  DOCUMENT_ADDED = 'document_added',
  COMMENT_ADDED = 'comment_added',
}

@Entity('asset_history')
export class AssetHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({
    type: 'enum',
    enum: AssetHistoryEventType,
  })
  eventType: AssetHistoryEventType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  laborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  partsCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  downtimeCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCost: number;

  @Column({ type: 'int', nullable: true })
  downtimeMinutes: number;

  @Column({ type: 'uuid', nullable: true })
  workOrderId: string;

  @Column({ type: 'uuid', nullable: true })
  performedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  performedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  previousValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
