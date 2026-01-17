import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrderType, WorkOrderPriority } from '@app/common/enums';
import { Organization } from './organization.entity';

@Entity('work_order_templates')
export class WorkOrderTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ type: 'jsonb', nullable: true })
  checklist: Array<{
    item: string;
    mandatory: boolean;
    order: number;
  }>;

  @Column({ type: 'text', array: true, nullable: true })
  requiredSkills: string[];

  @Column({ type: 'text', array: true, nullable: true })
  requiredTools: string[];

  @Column({ type: 'text', nullable: true })
  safetyProcedures: string;

  @Column({ type: 'jsonb', nullable: true })
  requiredParts: Array<{
    inventoryId: string;
    partName: string;
    quantity: number;
  }>;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
