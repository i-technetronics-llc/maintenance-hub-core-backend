import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SLAService } from './sla.service';
import { CreateSLADto } from './dto/create-sla.dto';
import { UpdateSLADto } from './dto/update-sla.dto';
import { JwtAuthGuard } from '@app/common/guards';
import { Permissions } from '@app/common/decorators';
import { SLACategory } from '@app/database/entities/sla.entity';

@ApiTags('sla')
@Controller('sla')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SLAController {
  constructor(private readonly slaService: SLAService) {}

  @Post()
  @Permissions('sla:create')
  @ApiOperation({ summary: 'Create a new SLA' })
  create(@Body() createSLADto: CreateSLADto) {
    return this.slaService.create(createSLADto);
  }

  @Get()
  @Permissions('sla:view')
  @ApiOperation({ summary: 'Get all SLAs' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.slaService.findAll(organizationId, clientId);
  }

  @Get('defaults')
  @Permissions('sla:view')
  @ApiOperation({ summary: 'Get default SLAs' })
  findDefaults() {
    return this.slaService.findDefaults();
  }

  @Get('stats')
  @Permissions('sla:view')
  @ApiOperation({ summary: 'Get SLA statistics' })
  @ApiQuery({ name: 'organizationId', required: false })
  getStats(@Query('organizationId') organizationId?: string) {
    return this.slaService.getStats(organizationId);
  }

  @Get('count')
  @Permissions('sla:view')
  @ApiOperation({ summary: 'Get total count of SLAs' })
  @ApiQuery({ name: 'organizationId', required: false })
  count(@Query('organizationId') organizationId?: string) {
    return this.slaService.count(organizationId);
  }

  @Get('by-client/:clientId')
  @Permissions('sla:view')
  @ApiOperation({ summary: 'Get SLAs by client ID' })
  findByClient(@Param('clientId') clientId: string) {
    return this.slaService.findByClient(clientId);
  }

  @Get('by-category/:category')
  @Permissions('sla:view')
  @ApiOperation({ summary: 'Get SLAs by category' })
  @ApiQuery({ name: 'organizationId', required: false })
  findByCategory(
    @Param('category') category: SLACategory,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.slaService.findByCategory(category, organizationId);
  }

  @Get(':id')
  @Permissions('sla:view')
  @ApiOperation({ summary: 'Get an SLA by ID' })
  findOne(@Param('id') id: string) {
    return this.slaService.findOne(id);
  }

  @Patch(':id')
  @Permissions('sla:edit')
  @ApiOperation({ summary: 'Update an SLA' })
  update(@Param('id') id: string, @Body() updateSLADto: UpdateSLADto) {
    return this.slaService.update(id, updateSLADto);
  }

  @Delete(':id')
  @Permissions('sla:delete')
  @ApiOperation({ summary: 'Delete an SLA' })
  remove(@Param('id') id: string) {
    return this.slaService.remove(id);
  }
}
