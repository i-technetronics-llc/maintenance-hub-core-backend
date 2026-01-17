import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum SkillLevel {
  ENTRY = 'entry',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

@Entity('pm_tasks')
export class PMTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  procedureSteps: Array<{
    stepNumber: number;
    instruction: string;
    estimatedMinutes: number;
    requiresPhoto: boolean;
    safetyNotes?: string;
  }>;

  @Column({ type: 'text', array: true, nullable: true })
  requiredSkills: string[];

  @Column({
    type: 'enum',
    enum: SkillLevel,
    default: SkillLevel.INTERMEDIATE,
  })
  minimumSkillLevel: SkillLevel;

  @Column({ type: 'text', array: true, nullable: true })
  requiredTools: string[];

  @Column({ type: 'text', array: true, nullable: true })
  requiredPPE: string[]; // Personal Protective Equipment

  @Column({ type: 'int', nullable: true })
  estimatedDurationMinutes: number;

  @Column({ type: 'text', nullable: true })
  safetyProcedures: string;

  @Column({ type: 'text', nullable: true })
  precautions: string;

  @Column({ type: 'jsonb', nullable: true })
  requiredParts: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    optional: boolean;
  }>;

  @Column({ type: 'text', array: true, nullable: true })
  assetTypes: string[]; // Asset types this task applies to

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
