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
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '@app/common/guards';

@ApiTags('sites')
@Controller('sites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new site' })
  create(@Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(createSiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sites' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.sitesService.findAll(organizationId, clientId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total count of sites' })
  @ApiQuery({ name: 'organizationId', required: false })
  count(@Query('organizationId') organizationId?: string) {
    return this.sitesService.count(organizationId);
  }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: 'Get sites by client ID' })
  findByClient(@Param('clientId') clientId: string) {
    return this.sitesService.findByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a site by ID' })
  findOne(@Param('id') id: string) {
    return this.sitesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a site' })
  update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    return this.sitesService.update(id, updateSiteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a site' })
  remove(@Param('id') id: string) {
    return this.sitesService.remove(id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a user to a site' })
  assignUser(
    @Param('id') id: string,
    @Body() body: { assignedUserId: string | null },
  ) {
    return this.sitesService.assignUser(id, body.assignedUserId);
  }
}
