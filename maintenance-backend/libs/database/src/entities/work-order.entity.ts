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
import {
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderRiskLevel,
  WorkOrderUrgency,
} from '@app/common/enums';
import { Asset } from './asset.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { WorkOrderAttachment } from './work-order-attachment.entity';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  woNumber: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: WorkOrderType,
    nullable: true,
  })
  type: WorkOrderType;

  @Column({
    type: 'enum',
    enum: WorkOrderPriority,
    default: WorkOrderPriority.MEDIUM,
  })
  priority: WorkOrderPriority;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.DRAFT,
  })
  status: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: WorkOrderRiskLevel,
    default: WorkOrderRiskLevel.LOW,
  })
  riskLevel: WorkOrderRiskLevel;

  @Column({
    type: 'enum',
    enum: WorkOrderUrgency,
    default: WorkOrderUrgency.NORMAL,
  })
  urgency: WorkOrderUrgency;

  @Column({ type: 'uuid', nullable: true })
  assetId: string;

  @ManyToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'uuid', nullable: true })
  clientOrgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'clientOrgId' })
  clientOrganization: Organization;

  @Column({ type: 'uuid', nullable: true })
  vendorOrgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'vendorOrgId' })
  vendorOrganization: Organization;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  scheduledStart: Date;

  @Column({ nullable: true })
  scheduledEnd: Date;

  @Column({ nullable: true })
  actualStart: Date;

  @Column({ nullable: true })
  actualEnd: Date;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'jsonb', nullable: true })
  checklist: Array<{
    item: string;
    completed: boolean;
    mandatory: boolean;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number;

  @OneToMany(() => WorkOrderAttachment, (attachment) => attachment.workOrder)
  attachments: WorkOrderAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
