import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Company } from './company.entity';
import { Organization } from './organization.entity';

@Entity('organization_types')
export class OrganizationType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string; // e.g., 'VENDOR', 'CLIENT'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  allowSelfOnboarding: boolean; // Can organizations of this type self-onboard?

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @OneToMany(() => Company, (company) => company.organizationType)
  companies: Company[];

  @OneToMany(() => Organization, (organization) => organization.organizationType)
  organizations: Organization[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
