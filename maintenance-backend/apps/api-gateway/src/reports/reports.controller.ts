import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto, ExecuteReportDto } from './dto';
import { JwtAuthGuard } from '@app/common/guards';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report definition' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createReportDto: CreateReportDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.user?.companyId || req.user?.company?.id;
    return this.reportsService.create(createReportDto, userId, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved reports for the current user/company' })
  @ApiResponse({ status: 200, description: 'Returns list of saved reports' })
  findAll(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.user?.companyId || req.user?.company?.id;
    return this.reportsService.findAll(userId, companyId);
  }

  @Get('data-sources')
  @ApiOperation({ summary: 'Get available data sources for reports' })
  @ApiResponse({ status: 200, description: 'Returns list of data sources' })
  getDataSources() {
    return this.reportsService.getAvailableDataSources();
  }

  @Get('columns/:dataSource')
  @ApiOperation({ summary: 'Get available columns for a data source' })
  @ApiParam({ name: 'dataSource', description: 'The data source to get columns for' })
  @ApiResponse({ status: 200, description: 'Returns list of columns' })
  getColumns(@Param('dataSource') dataSource: string) {
    return this.reportsService.getColumnsForDataSource(dataSource);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report definition by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Returns the report definition' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.user?.companyId || req.user?.company?.id;
    return this.reportsService.findOne(id, userId, companyId);
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a report and return data' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Returns report execution results' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  execute(
    @Param('id') id: string,
    @Body() executeReportDto: ExecuteReportDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.user?.companyId || req.user?.company?.id;
    return this.reportsService.execute(id, executeReportDto, userId, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a report definition' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Only the creator can update' })
  update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.user?.companyId || req.user?.company?.id;
    return this.reportsService.update(id, updateReportDto, userId, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 204, description: 'Report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Only the creator can delete' })
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const companyId = req.user?.companyId || req.user?.company?.id;
    return this.reportsService.remove(id, userId, companyId);
  }
}
