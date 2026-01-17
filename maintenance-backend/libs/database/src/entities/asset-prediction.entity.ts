import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Organization } from './organization.entity';
import { PredictionModel } from './prediction-model.entity';
import { User } from './user.entity';

export enum PredictionType {
  ANOMALY = 'anomaly',
  FAILURE = 'failure',
  REMAINING_LIFE = 'remaining_life',
  DEGRADATION = 'degradation',
}

export enum PredictionStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  WORK_ORDER_CREATED = 'work_order_created',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  DISMISSED = 'dismissed',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('asset_predictions')
export class AssetPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'uuid', nullable: true })
  predictionModelId: string;

  @ManyToOne(() => PredictionModel)
  @JoinColumn({ name: 'predictionModelId' })
  predictionModel: PredictionModel;

  @Column({
    type: 'enum',
    enum: PredictionType,
  })
  predictionType: PredictionType;

  @Column({ type: 'text' })
  prediction: string;

  // Probability of the predicted event occurring (0-100)
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  probability: number;

  // Confidence in the prediction (0-100)
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidence: number;

  // Predicted date of failure/event
  @Column({ nullable: true })
  predictedDate: Date;

  // Remaining useful life in days (for remaining_life predictions)
  @Column({ type: 'int', nullable: true })
  remainingLifeDays: number;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.LOW,
  })
  riskLevel: RiskLevel;

  @Column({
    type: 'enum',
    enum: PredictionStatus,
    default: PredictionStatus.NEW,
  })
  status: PredictionStatus;

  // Contributing factors to the prediction
  @Column({ type: 'jsonb', default: [] })
  factors: Array<{
    name: string;
    contribution: number; // Percentage contribution to prediction
    value: number;
    threshold?: number;
    unit?: string;
    description?: string;
  }>;

  // Recommended actions
  @Column({ type: 'text', nullable: true })
  recommendedAction: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  potentialSavings: number;

  // Tracking
  @Column({ nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  acknowledgedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'acknowledgedById' })
  acknowledgedBy: User;

  @Column({ type: 'uuid', nullable: true })
  workOrderId: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  // Validation (was the prediction accurate?)
  @Column({ type: 'boolean', nullable: true })
  wasAccurate: boolean;

  @Column({ type: 'date', nullable: true })
  actualFailureDate: Date;

  // Organization scope
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
