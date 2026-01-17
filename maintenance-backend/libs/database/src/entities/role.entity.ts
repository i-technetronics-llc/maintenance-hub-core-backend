import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '@app/common/enums';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    unique: true,
  })
  name: UserRole;

  @Column()
  description: string;

  @Column({ type: 'jsonb' })
  permissions: string[];

  @Column({ type: 'uuid', nullable: true })
  companyId: string; // Null for system roles (SUPER_ADMIN, etc.)

  @Column({ default: false })
  isSystemRole: boolean; // True for SUPER_ADMIN, COMPANY_ADMIN, etc.

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @CreateDateColumn()
  createdAt: Date;
}
