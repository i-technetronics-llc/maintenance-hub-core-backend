import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IntegrationConfig } from './integration-config.entity';

export enum SyncDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum SyncLogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
  SKIPPED = 'skipped',
}

@Entity('integration_logs')
export class IntegrationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  integrationId: string;

  @ManyToOne(() => IntegrationConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integrationId' })
  integration: IntegrationConfig;

  @Column({
    type: 'enum',
    enum: SyncDirection,
  })
  direction: SyncDirection;

  // Type of entity being synced: asset, inventory, work_order, purchase_order
  @Column()
  entityType: string;

  // ID of the entity in our system (if applicable)
  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  // ID of the entity in the ERP system (if applicable)
  @Column({ nullable: true })
  externalId: string;

  @Column({
    type: 'enum',
    enum: SyncLogStatus,
  })
  status: SyncLogStatus;

  // The request sent to ERP
  @Column({ type: 'jsonb', nullable: true })
  request: Record<string, any>;

  // The response received from ERP
  @Column({ type: 'jsonb', nullable: true })
  response: Record<string, any>;

  // Error message if sync failed
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // Error details/stack trace
  @Column({ type: 'jsonb', nullable: true })
  errorDetails: Record<string, any>;

  // Duration of the sync operation in milliseconds
  @Column({ type: 'int', nullable: true })
  durationMs: number;

  // Number of records processed
  @Column({ type: 'int', default: 0 })
  recordsProcessed: number;

  // Number of records that had errors
  @Column({ type: 'int', default: 0 })
  recordsWithErrors: number;

  @CreateDateColumn()
  createdAt: Date;
}
