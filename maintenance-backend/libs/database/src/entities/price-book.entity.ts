import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('price_books')
export class PriceBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => PriceBookItem, (item) => item.priceBook)
  items: PriceBookItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('price_book_items')
export class PriceBookItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  priceBookId: string;

  @ManyToOne(() => PriceBook, (priceBook) => priceBook.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'priceBookId' })
  priceBook: PriceBook;

  @Column({ type: 'enum', enum: ['inventory', 'service'], default: 'inventory' })
  itemType: 'inventory' | 'service';

  @Column({ type: 'uuid' })
  itemId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
