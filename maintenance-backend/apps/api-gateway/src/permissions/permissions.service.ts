import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from '@app/database/entities/permission.entity';
import { RolePermission } from '@app/database/entities/role-permission.entity';
import { Role } from '@app/database/entities/role.entity';
import { PermissionModule } from '@app/common/enums';
import { CreatePermissionDto, UpdatePermissionDto, AssignPermissionsDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // Check if permission code already exists
    const existingPermission = await this.permissionRepository.findOne({
      where: { code: createPermissionDto.code },
    });

    if (existingPermission) {
      throw new ConflictException(`Permission with code '${createPermissionDto.code}' already exists`);
    }

    const permission = this.permissionRepository.create({
      ...createPermissionDto,
      isActive: createPermissionDto.isActive !== undefined ? createPermissionDto.isActive : true,
    });

    return await this.permissionRepository.save(permission);
  }

  async getAllPermissions(groupByModule = false): Promise<any> {
    const permissions = await this.permissionRepository.find({
      order: {
        module: 'ASC',
        action: 'ASC',
      },
    });

    if (!groupByModule) {
      return permissions;
    }

    // Group permissions by module
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return grouped;
  }

  async getPermissionsByModule(module: PermissionModule): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { module },
      order: {
        action: 'ASC',
      },
    });
  }

  async getPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    return permission;
  }

  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.getPermissionById(id);

    // Check if updating code and if new code already exists
    if (updatePermissionDto.code && updatePermissionDto.code !== permission.code) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: updatePermissionDto.code },
      });

      if (existingPermission) {
        throw new ConflictException(`Permission with code '${updatePermissionDto.code}' already exists`);
      }
    }

    Object.assign(permission, updatePermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.getPermissionById(id);

    // Check if permission is assigned to any roles
    const assignedCount = await this.rolePermissionRepository.count({
      where: { permissionId: id },
    });

    if (assignedCount > 0) {
      throw new BadRequestException(
        `Cannot delete permission. It is currently assigned to ${assignedCount} role(s). Please remove the assignments first.`
      );
    }

    await this.permissionRepository.remove(permission);
  }

  async assignPermissionsToRole(assignPermissionsDto: AssignPermissionsDto): Promise<void> {
    const { roleId, permissionIds } = assignPermissionsDto;

    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Verify all permissions exist
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Remove existing role permissions
    await this.rolePermissionRepository.delete({ roleId });

    // Create new role permissions
    const rolePermissions = permissionIds.map(permissionId =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      })
    );

    await this.rolePermissionRepository.save(rolePermissions);
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Return permissions from junction table
    const junctionPermissions = role.rolePermissions
      ? role.rolePermissions
          .filter(rp => rp.permission && rp.permission.isActive)
          .map(rp => rp.permission)
      : [];

    // Also include JSONB permissions if any (excluding wildcard)
    const jsonbPermissions = role.permissions && role.permissions.length > 0 && !role.permissions.includes('*')
      ? await this.permissionRepository.find({
          where: { code: In(role.permissions) },
        })
      : [];

    // Combine and deduplicate by ID
    const allPermissions = [...junctionPermissions, ...jsonbPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map(p => [p.id, p])).values()
    );

    return uniquePermissions;
  }

  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Verify all permissions exist
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Get existing role permissions
    const existingRolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
    });

    const existingPermissionIds = existingRolePermissions.map(rp => rp.permissionId);

    // Filter out permissions that are already assigned
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

    if (newPermissionIds.length === 0) {
      throw new BadRequestException('All specified permissions are already assigned to this role');
    }

    // Create new role permissions
    const rolePermissions = newPermissionIds.map(permissionId =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      })
    );

    await this.rolePermissionRepository.save(rolePermissions);
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<void> {
    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Remove role permissions
    await this.rolePermissionRepository.delete({
      roleId,
      permissionId: In(permissionIds),
    });
  }
}
