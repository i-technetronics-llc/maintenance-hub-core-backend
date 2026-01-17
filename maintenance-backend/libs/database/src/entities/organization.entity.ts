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
import { OrganizationType as OrganizationTypeEnum, OrganizationStatus } from '@app/common/enums';
import { User } from './user.entity';
import { OrganizationType } from './organization-type.entity';

@Entity('organizations')
export class Organization {
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

  @ManyToOne(() => OrganizationType, (orgType) => orgType.organizations, { eager: true })
  @JoinColumn({ name: 'organizationTypeId' })
  organizationType: OrganizationType;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status: OrganizationStatus;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  // @OneToMany(() => User, (user) => user.organization)
  // users: User[]; // Deprecated: Users now relate to Company entity

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
