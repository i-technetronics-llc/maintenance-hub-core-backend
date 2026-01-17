import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  OrganizationType as OrganizationTypeEnum,
  CompanyStatus,
  EmailValidationMode,
} from '@app/common/enums';
import { User } from './user.entity';
import { DomainVerification } from './domain-verification.entity';
import { OrganizationType } from './organization-type.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: OrganizationTypeEnum,
    nullable: true,
  })
  type: OrganizationTypeEnum; // Legacy field - kept for backward compatibility

  @Column({ type: 'uuid', nullable: true })
  organizationTypeId: string;

  @ManyToOne(() => OrganizationType, (orgType) => orgType.companies, { eager: true })
  @JoinColumn({ name: 'organizationTypeId' })
  organizationType: OrganizationType;

  @Column({ nullable: true })
  website: string;

  @Column()
  workEmail: string; // Primary corporate email

  @Column({ nullable: true })
  verifiedDomain: string; // Extracted from website, e.g., 'acmecorp.com'

  @Column({ default: false })
  isDomainVerified: boolean;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING_APPROVAL,
  })
  status: CompanyStatus;

  @Column({
    type: 'enum',
    enum: EmailValidationMode,
    default: EmailValidationMode.STRICT,
  })
  emailValidationMode: EmailValidationMode;

  // Detailed address information
  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    timezone?: string;
    currency?: string;
    [key: string]: any;
  };

  // Approval tracking
  @Column({ type: 'uuid', nullable: true })
  approvedBy: string; // Super-admin who approved

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  // Relationships
  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(
    () => DomainVerification,
    (verification) => verification.company,
  )
  domainVerifications: DomainVerification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
