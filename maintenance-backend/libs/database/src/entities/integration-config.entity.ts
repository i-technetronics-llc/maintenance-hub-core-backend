import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from './company.entity';

export enum IntegrationType {
  SAP = 'sap',
  ORACLE = 'oracle',
  DYNAMICS = 'dynamics',
}

export enum SyncStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

@Entity('integration_configs')
export class IntegrationConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({
    type: 'enum',
    enum: IntegrationType,
  })
  type: IntegrationType;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Encrypted JSON containing connection details
  // For SAP: { host, systemNumber, client, user, password, language }
  // For Oracle: { baseUrl, username, password, tenantId, clientId, clientSecret }
  @Column({ type: 'jsonb' })
  connectionConfig: Record<string, any>;

  // Field mappings between ERP and internal entities
  // { assets: { sapField: internalField }, inventory: { ... }, workOrders: { ... } }
  @Column({ type: 'jsonb', nullable: true })
  mappings: Record<string, Record<string, string>>;

  // Sync settings
  @Column({ type: 'jsonb', nullable: true })
  syncSettings: {
    syncAssets?: boolean;
    syncInventory?: boolean;
    syncWorkOrders?: boolean;
    syncPurchaseOrders?: boolean;
    syncInterval?: number; // in minutes
    autoSync?: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.IDLE,
  })
  syncStatus: SyncStatus;

  @Column({ type: 'text', nullable: true })
  lastSyncError: string;

  @Column({ type: 'jsonb', nullable: true })
  lastSyncStats: {
    assetsCreated?: number;
    assetsUpdated?: number;
    inventoryCreated?: number;
    inventoryUpdated?: number;
    workOrdersSynced?: number;
    errors?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
