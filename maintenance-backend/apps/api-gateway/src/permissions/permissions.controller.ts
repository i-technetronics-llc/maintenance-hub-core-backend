import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto, AssignPermissionsDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@app/common/guards';
import { Permissions } from '@app/common/decorators';
import { PermissionModule } from '@app/common/enums';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('permissions:create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Permission code already exists' })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionsService.createPermission(createPermissionDto);
    return {
      success: true,
      message: 'Permission created successfully',
      data: permission,
    };
  }

  @Get()
  @Permissions('permissions:view')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiQuery({ name: 'grouped', required: false, type: Boolean, description: 'Group permissions by module' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getAllPermissions(@Query('grouped') grouped?: string) {
    const groupByModule = grouped === 'true';
    const permissions = await this.permissionsService.getAllPermissions(groupByModule);
    return {
      success: true,
      data: permissions,
    };
  }

  @Get('grouped')
  @Permissions('permissions:view')
  @ApiOperation({ summary: 'Get permissions grouped by module' })
  @ApiResponse({ status: 200, description: 'Grouped permissions retrieved successfully' })
  async getGroupedPermissions() {
    const permissions = await this.permissionsService.getAllPermissions(true);
    return {
      success: true,
      data: permissions,
    };
  }

  @Get('module/:module')
  @Permissions('permissions:view')
  @ApiOperation({ summary: 'Get permissions by module' })
  @ApiResponse({ status: 200, description: 'Module permissions retrieved successfully' })
  async getPermissionsByModule(@Param('module') module: PermissionModule) {
    const permissions = await this.permissionsService.getPermissionsByModule(module);
    return {
      success: true,
      data: permissions,
    };
  }

  @Get('role/:roleId')
  @Permissions('roles:view')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @ApiResponse({ status: 200, description: 'Role permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    const permissions = await this.permissionsService.getRolePermissions(roleId);
    return {
      success: true,
      data: permissions,
    };
  }

  @Get(':id')
  @Permissions('permissions:view')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async getPermissionById(@Param('id') id: string) {
    const permission = await this.permissionsService.getPermissionById(id);
    return {
      success: true,
      data: permission,
    };
  }

  @Patch(':id')
  @Permissions('permissions:edit')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 409, description: 'Permission code already exists' })
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionsService.updatePermission(id, updatePermissionDto);
    return {
      success: true,
      message: 'Permission updated successfully',
      data: permission,
    };
  }

  @Delete(':id')
  @Permissions('permissions:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete permission that is assigned to roles' })
  async deletePermission(@Param('id') id: string) {
    await this.permissionsService.deletePermission(id);
  }

  @Post('assign-to-role')
  @Permissions('roles:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign permissions to a role (replaces existing assignments)' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Invalid permission IDs' })
  async assignPermissionsToRole(@Body() assignPermissionsDto: AssignPermissionsDto) {
    await this.permissionsService.assignPermissionsToRole(assignPermissionsDto);
    return {
      success: true,
      message: 'Permissions assigned to role successfully',
    };
  }

  @Post('role/:roleId/add')
  @Permissions('roles:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add permissions to a role (keeps existing assignments)' })
  @ApiResponse({ status: 200, description: 'Permissions added successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Invalid permission IDs or already assigned' })
  async addPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body('permissionIds') permissionIds: string[],
  ) {
    await this.permissionsService.addPermissionsToRole(roleId, permissionIds);
    return {
      success: true,
      message: 'Permissions added to role successfully',
    };
  }

  @Post('role/:roleId/remove')
  @Permissions('roles:edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove permissions from a role' })
  @ApiResponse({ status: 200, description: 'Permissions removed successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async removePermissionsFromRole(
    @Param('roleId') roleId: string,
    @Body('permissionIds') permissionIds: string[],
  ) {
    await this.permissionsService.removePermissionsFromRole(roleId, permissionIds);
    return {
      success: true,
      message: 'Permissions removed from role successfully',
    };
  }
}
