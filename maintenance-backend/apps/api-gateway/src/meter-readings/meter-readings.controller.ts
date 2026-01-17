import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { MeterReadingsService } from './meter-readings.service';
import { CreateMeterReadingDto, QueryMeterReadingsDto } from './dto';
import { MeterType } from '@app/database/entities/meter-reading.entity';

@ApiTags('Meter Readings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('meter-readings')
export class MeterReadingsController {
  constructor(private readonly meterReadingsService: MeterReadingsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new meter reading' })
  @ApiResponse({
    status: 201,
    description: 'Meter reading recorded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async create(
    @Body() createDto: CreateMeterReadingDto,
    @Request() req: any,
  ) {
    const recordedById = req.user?.id || req.user?.sub;
    return await this.meterReadingsService.create(createDto, recordedById);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk import meter readings' })
  @ApiResponse({
    status: 200,
    description: 'Bulk import completed',
    schema: {
      properties: {
        created: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async bulkCreate(
    @Body() readings: CreateMeterReadingDto[],
    @Request() req: any,
  ) {
    const recordedById = req.user?.id || req.user?.sub;
    return await this.meterReadingsService.bulkCreate(readings, recordedById);
  }

  @Get('asset/:assetId')
  @ApiOperation({ summary: 'Get meter readings for an asset' })
  @ApiParam({ name: 'assetId', description: 'Asset UUID' })
  @ApiResponse({ status: 200, description: 'List of meter readings' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findByAsset(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query() query: QueryMeterReadingsDto,
  ) {
    return await this.meterReadingsService.findByAsset(assetId, query);
  }

  @Get('latest/:assetId')
  @ApiOperation({ summary: 'Get latest meter reading for an asset' })
  @ApiParam({ name: 'assetId', description: 'Asset UUID' })
  @ApiQuery({
    name: 'meterType',
    required: false,
    enum: MeterType,
    description: 'Filter by specific meter type',
  })
  @ApiResponse({ status: 200, description: 'Latest meter reading' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getLatest(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('meterType') meterType?: MeterType,
  ) {
    const reading = await this.meterReadingsService.getLatest(
      assetId,
      meterType,
    );
    return {
      reading,
      message: reading
        ? 'Latest meter reading found'
        : 'No meter readings found for this asset',
    };
  }

  @Get('statistics/:assetId')
  @ApiOperation({ summary: 'Get meter reading statistics for an asset' })
  @ApiParam({ name: 'assetId', description: 'Asset UUID' })
  @ApiQuery({
    name: 'meterType',
    required: true,
    enum: MeterType,
    description: 'Meter type for statistics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Meter reading statistics',
    schema: {
      properties: {
        averageDaily: { type: 'number', description: 'Average daily usage' },
        totalUsage: { type: 'number', description: 'Total usage in period' },
        readingCount: { type: 'number', description: 'Number of readings' },
        projectedNextMilestone: {
          type: 'number',
          nullable: true,
          description: 'Days until next PM milestone',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getStatistics(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query('meterType') meterType: MeterType,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return await this.meterReadingsService.getReadingStatistics(
      assetId,
      meterType,
      daysNum,
    );
  }
}
