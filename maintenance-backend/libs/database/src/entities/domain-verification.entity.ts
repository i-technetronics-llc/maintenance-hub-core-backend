import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VerificationStatus } from '@app/common/enums';
import { Company } from './company.entity';

export enum VerificationMethod {
  FILE = 'file',
  TXT_RECORD = 'txt_record',
  CNAME_RECORD = 'cname_record',
  META_TAG = 'meta_tag',
}

export enum VerificationStep {
  INITIATED = 'initiated',
  INSTRUCTIONS_SENT = 'instructions_sent',
  AWAITING_VERIFICATION = 'awaiting_verification',
  VERIFICATION_IN_PROGRESS = 'verification_in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('domain_verifications')
export class DomainVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.domainVerifications)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  domain: string; // e.g., 'acmecorp.com'

  @Column({
    type: 'enum',
    enum: VerificationMethod,
    default: VerificationMethod.TXT_RECORD,
  })
  verificationMethod: VerificationMethod;

  @Column({ length: 64 })
  verificationCode: string; // 32-character unique verification code

  @Column()
  verificationHash: string; // Unique hash for verification file content

  @Column({ nullable: true })
  verificationFileName: string; // e.g., 'company-verification-abc123.txt'

  // For TXT record verification
  @Column({ nullable: true })
  txtRecordName: string; // e.g., '_cmms-verification.acmecorp.com'

  @Column({ nullable: true })
  txtRecordValue: string; // e.g., 'cmms-verify=abc123...'

  // Wizard step tracking
  @Column({
    type: 'enum',
    enum: VerificationStep,
    default: VerificationStep.INITIATED,
  })
  currentStep: VerificationStep;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  // 72-hour deadline tracking
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isExpired: boolean;

  @Column({ default: false })
  deadlineExtended: boolean;

  @Column({ type: 'int', default: 0 })
  extensionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date;

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ type: 'int', default: 10 })
  maxAttempts: number;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  // Re-verification scheduling
  @Column({ default: false })
  requiresReverification: boolean;

  @Column({ type: 'timestamp', nullable: true })
  nextReverificationDate: Date;

  @Column({ type: 'int', default: 0 })
  reverificationCount: number;

  @Column({ type: 'jsonb', nullable: true })
  verificationHistory: Array<{
    timestamp: Date;
    status: string;
    method: string;
    result: string;
    details?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
