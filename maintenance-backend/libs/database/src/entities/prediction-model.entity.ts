import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum PredictionModelType {
  ANOMALY_DETECTION = 'anomaly_detection',
  FAILURE_PREDICTION = 'failure_prediction',
  REMAINING_LIFE = 'remaining_life',
}

export enum PredictionModelStatus {
  TRAINING = 'training',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
}

@Entity('prediction_models')
export class PredictionModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  assetType: string;

  @Column({
    type: 'enum',
    enum: PredictionModelType,
  })
  modelType: PredictionModelType;

  @Column({
    type: 'enum',
    enum: PredictionModelStatus,
    default: PredictionModelStatus.ACTIVE,
  })
  status: PredictionModelStatus;

  // Model parameters stored as JSON
  @Column({ type: 'jsonb', default: {} })
  parameters: {
    // Z-score parameters for anomaly detection
    zScoreThreshold?: number;
    iqrMultiplier?: number;
    // Exponential smoothing for trend prediction
    alpha?: number; // Smoothing factor (0-1)
    beta?: number;  // Trend factor (0-1)
    gamma?: number; // Seasonality factor (0-1)
    // Weibull distribution for remaining life
    shape?: number;  // Shape parameter (k)
    scale?: number;  // Scale parameter (lambda)
    // General parameters
    windowSize?: number;
    minDataPoints?: number;
    trainingIterations?: number;
    [key: string]: any;
  };

  // Model accuracy metrics
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  accuracy: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  precision: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  recall: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  f1Score: number;

  // Training data statistics
  @Column({ type: 'int', default: 0 })
  trainingDataPoints: number;

  @Column({ type: 'jsonb', nullable: true })
  trainingStats: {
    mean?: number;
    stdDev?: number;
    min?: number;
    max?: number;
    q1?: number;
    q2?: number;
    q3?: number;
    [key: string]: any;
  };

  @Column({ nullable: true })
  lastTrainedAt: Date;

  @Column({ nullable: true })
  lastPredictionAt: Date;

  @Column({ type: 'int', default: 0 })
  totalPredictions: number;

  @Column({ type: 'int', default: 0 })
  correctPredictions: number;

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
