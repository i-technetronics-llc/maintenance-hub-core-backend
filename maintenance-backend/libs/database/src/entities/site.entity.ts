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
import { Client } from './client.entity';
import { User } from './user.entity';
import { SLA } from './sla.entity';

export enum SiteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_CONSTRUCTION = 'under_construction',
  DECOMMISSIONED = 'decommissioned',
}

export enum SiteType {
  COMMERCIAL = 'commercial',
  RESIDENTIAL = 'residential',
  INDUSTRIAL = 'industrial',
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  RETAIL = 'retail',
  OTHER = 'other',
}

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ type: 'enum', enum: SiteType, default: SiteType.COMMERCIAL })
  type: SiteType;

  @Column({ type: 'enum', enum: SiteStatus, default: SiteStatus.ACTIVE })
  status: SiteStatus;

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

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'uuid', nullable: true })
  assignedUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser: User;

  @Column({ type: 'uuid', nullable: true })
  slaId: string;

  @ManyToOne(() => SLA, { nullable: true })
  @JoinColumn({ name: 'slaId' })
  sla: SLA;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
