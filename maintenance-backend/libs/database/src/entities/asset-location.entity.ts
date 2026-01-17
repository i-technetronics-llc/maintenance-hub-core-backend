import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('asset_locations')
export class AssetLocation {
  @PrimaryGeneratedColumn('uuid')
  locationId: string;

  @Column()
  locationName: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'point', nullable: true })
  coordinates: { x: number; y: number };

  @Column({ nullable: true })
  region: string;

  @Column({ type: 'uuid' })
  clientOrgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'clientOrgId' })
  clientOrganization: Organization;

  @CreateDateColumn()
  createdAt: Date;
}
