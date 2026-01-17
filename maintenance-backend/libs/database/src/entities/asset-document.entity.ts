import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { User } from './user.entity';

export enum AssetDocumentType {
  MANUAL = 'manual',
  WARRANTY = 'warranty',
  CERTIFICATION = 'certification',
  SPECIFICATION = 'specification',
  DRAWING = 'drawing',
  PHOTO = 'photo',
  VIDEO = 'video',
  INSPECTION_REPORT = 'inspection_report',
  MAINTENANCE_RECORD = 'maintenance_record',
  COMPLIANCE = 'compliance',
  INVOICE = 'invoice',
  OTHER = 'other',
}

@Entity('asset_documents')
export class AssetDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({
    type: 'enum',
    enum: AssetDocumentType,
    default: AssetDocumentType.OTHER,
  })
  documentType: AssetDocumentType;

  @Column()
  fileName: string;

  @Column()
  originalFileName: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  fileType: string; // MIME type

  @Column({ type: 'int', nullable: true })
  fileSize: number; // bytes

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  version: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
