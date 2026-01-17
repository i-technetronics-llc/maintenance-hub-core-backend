import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@app/common/guards';
import { Permissions } from '@app/common/decorators';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAll() {
    const roles = await this.rolesService.findAll();
    return {
      success: true,
      data: roles,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(id);
    return {
      success: true,
      data: role,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles:edit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles:delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
  }
}
