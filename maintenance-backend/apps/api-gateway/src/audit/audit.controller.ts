import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard, RolesGuard } from '@app/common/guards';
import { Roles } from '@app/common/decorators';
import { UserRole } from '@app/common/enums';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all audit logs with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.auditService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      userId,
      action,
      entityType,
      startDate,
      endDate,
      search,
    });
  }

  @Get('actions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all distinct actions for filtering' })
  getActions() {
    return this.auditService.getActions();
  }

  @Get('entity-types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all distinct entity types for filtering' })
  getEntityTypes() {
    return this.auditService.getEntityTypes();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get audit log by ID' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
