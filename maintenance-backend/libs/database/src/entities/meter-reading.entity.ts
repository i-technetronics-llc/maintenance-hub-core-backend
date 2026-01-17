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

export enum MeterType {
  RUNTIME_HOURS = 'runtime_hours',
  CYCLES = 'cycles',
  PRODUCTION_COUNT = 'production_count',
  MILEAGE = 'mileage',
  ENERGY_KWH = 'energy_kwh',
  FUEL_CONSUMPTION = 'fuel_consumption',
  TEMPERATURE = 'temperature',
  PRESSURE = 'pressure',
  VIBRATION = 'vibration',
  CUSTOM = 'custom',
}

@Entity('meter_readings')
export class MeterReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({
    type: 'enum',
    enum: MeterType,
    default: MeterType.RUNTIME_HOURS,
  })
  meterType: MeterType;

  @Column({ nullable: true })
  customMeterName: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  readingValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  previousReadingValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  usageSinceLastReading: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'uuid', nullable: true })
  recordedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @Column({ type: 'timestamp' })
  recordedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  source: string; // 'manual', 'iot_sensor', 'import'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
