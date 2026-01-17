import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';

export enum SignerType {
  TECHNICIAN = 'technician',
  SUPERVISOR = 'supervisor',
  CUSTOMER = 'customer',
  WITNESS = 'witness',
  INSPECTOR = 'inspector',
}

@Entity('work_order_signatures')
export class WorkOrderSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({
    type: 'enum',
    enum: SignerType,
  })
  signerType: SignerType;

  @Column()
  signerName: string;

  @Column({ nullable: true })
  signerEmail: string;

  @Column({ nullable: true })
  signerTitle: string;

  @Column({ type: 'text' })
  signatureData: string; // Base64 encoded signature image

  @Column({ type: 'timestamp' })
  signedAt: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
