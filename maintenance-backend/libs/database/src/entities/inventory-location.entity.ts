import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_locations')
export class InventoryLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  building: string;

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  room: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  aisle: string;

  @Column({ nullable: true })
  rack: string;

  @Column({ nullable: true })
  bin: string;

  @Column({ type: 'uuid', nullable: true })
  parentLocationId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
