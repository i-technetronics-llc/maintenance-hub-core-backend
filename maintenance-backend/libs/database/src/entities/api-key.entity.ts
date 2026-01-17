import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';

export enum ApiKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ unique: true })
  keyHash: string; // Hashed API key (never store plain key)

  @Column()
  keyPrefix: string; // First 8 characters for identification

  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'text', array: true, nullable: true })
  allowedIps: string[];

  @Column({ type: 'text', array: true, nullable: true })
  scopes: string[]; // Permissions/scopes for this key

  @Column({ type: 'int', nullable: true })
  rateLimit: number; // Requests per minute

  @Column({ type: 'date', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'bigint', default: 0 })
  usageCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
