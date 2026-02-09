import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '@app/common/guards';
import { Permissions } from '@app/common/decorators';

@ApiTags('assets')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Permissions('asset_management:create')
  @ApiOperation({ summary: 'Create a new asset' })
  create(@Body() createAssetDto: CreateAssetDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.assetsService.create(createAssetDto, userId);
  }

  @Get()
  @Permissions('asset_management:view')
  @ApiOperation({ summary: 'Get all assets' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization ID' })
  findAll(@Query('organizationId') organizationId?: string) {
    return this.assetsService.findAll(organizationId);
  }

  @Get(':id')
  @Permissions('asset_management:view')
  @ApiOperation({ summary: 'Get an asset by ID' })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('asset_management:edit')
  @ApiOperation({ summary: 'Update an asset' })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.assetsService.update(id, updateAssetDto, userId);
  }

  @Delete(':id')
  @Permissions('asset_management:delete')
  @ApiOperation({ summary: 'Delete an asset' })
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.assetsService.remove(id, userId);
  }
}
