import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';

@Entity('work_order_attachments')
export class WorkOrderAttachment {
  @PrimaryGeneratedColumn('uuid')
  attachmentId: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, (wo) => wo.attachments)
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileType: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'uuid' })
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  uploadedAt: Date;
}
