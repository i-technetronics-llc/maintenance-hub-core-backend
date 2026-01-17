import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Organization } from './organization.entity';

export enum SensorType {
  TEMPERATURE = 'temperature',
  VIBRATION = 'vibration',
  PRESSURE = 'pressure',
  CURRENT = 'current',
  VOLTAGE = 'voltage',
  HUMIDITY = 'humidity',
  FLOW_RATE = 'flow_rate',
  RPM = 'rpm',
  POWER = 'power',
  OIL_LEVEL = 'oil_level',
  OIL_QUALITY = 'oil_quality',
  NOISE_LEVEL = 'noise_level',
  CUSTOM = 'custom',
}

@Entity('sensor_data')
@Index(['assetId', 'sensorType', 'timestamp'])
@Index(['organizationId', 'timestamp'])
export class SensorData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({
    type: 'enum',
    enum: SensorType,
  })
  sensorType: SensorType;

  @Column({ nullable: true })
  sensorId: string; // Physical sensor identifier

  @Column({ nullable: true })
  sensorName: string;

  // The actual sensor reading value
  @Column({ type: 'decimal', precision: 15, scale: 6 })
  value: number;

  @Column({ nullable: true })
  unit: string; // e.g., "°C", "Hz", "PSI", "A"

  @Column()
  timestamp: Date;

  // Statistical flags
  @Column({ type: 'boolean', default: false })
  isAnomaly: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  zScore: number; // Standard deviations from mean

  // Quality metrics
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  qualityScore: number; // 0-100 data quality score

  @Column({ type: 'boolean', default: false })
  isInterpolated: boolean;

  @Column({ type: 'boolean', default: false })
  isOutOfRange: boolean;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source?: string;
    deviceId?: string;
    firmwareVersion?: string;
    batteryLevel?: number;
    signalStrength?: number;
    [key: string]: any;
  };

  // Expected range for this sensor type (can be asset-specific)
  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  minExpected: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  maxExpected: number;

  // Organization scope
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;
}
