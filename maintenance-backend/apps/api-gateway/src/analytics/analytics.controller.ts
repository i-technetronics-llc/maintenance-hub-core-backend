import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService, DateRangeQuery } from './analytics.service';
import { JwtAuthGuard } from '@app/common/guards';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  async getDashboardAnalytics() {
    const analytics = await this.analyticsService.getDashboardAnalytics();
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('kpi-dashboard')
  @ApiOperation({ summary: 'Get KPI dashboard with key performance indicators' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'KPI dashboard retrieved successfully' })
  async getKPIDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: DateRangeQuery = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const kpis = await this.analyticsService.getKPIDashboard(query);
    return {
      success: true,
      data: kpis,
    };
  }

  @Get('work-orders')
  @ApiOperation({ summary: 'Get work order statistics' })
  @ApiResponse({ status: 200, description: 'Work order statistics retrieved successfully' })
  async getWorkOrderStats() {
    const stats = await this.analyticsService.getWorkOrderStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('work-orders/metrics')
  @ApiOperation({ summary: 'Get comprehensive work order metrics and analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Work order metrics retrieved successfully' })
  async getWorkOrderMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: DateRangeQuery = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const metrics = await this.analyticsService.getWorkOrderMetrics(query);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('work-orders/trend')
  @ApiOperation({ summary: 'Get work order trend data for charts' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  @ApiResponse({ status: 200, description: 'Work order trend data retrieved successfully' })
  async getWorkOrderTrend(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    const trend = await this.analyticsService.getWorkOrderTrendData(numDays);
    return {
      success: true,
      data: trend,
    };
  }

  @Get('assets')
  @ApiOperation({ summary: 'Get asset statistics' })
  @ApiResponse({ status: 200, description: 'Asset statistics retrieved successfully' })
  async getAssetStats() {
    const stats = await this.analyticsService.getAssetStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('assets/performance')
  @ApiOperation({ summary: 'Get asset performance metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Asset performance metrics retrieved successfully' })
  async getAssetPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: DateRangeQuery = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const metrics = await this.analyticsService.getAssetPerformanceMetrics(query);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: 200, description: 'Inventory statistics retrieved successfully' })
  async getInventoryStats() {
    const stats = await this.analyticsService.getInventoryStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('inventory/metrics')
  @ApiOperation({ summary: 'Get comprehensive inventory metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Inventory metrics retrieved successfully' })
  async getInventoryMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: DateRangeQuery = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const metrics = await this.analyticsService.getInventoryMetrics(query);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('inventory/trend')
  @ApiOperation({ summary: 'Get inventory trend data by category' })
  @ApiResponse({ status: 200, description: 'Inventory trend data retrieved successfully' })
  async getInventoryTrend() {
    const trend = await this.analyticsService.getInventoryTrendData();
    return {
      success: true,
      data: trend,
    };
  }

  @Get('costs')
  @ApiOperation({ summary: 'Get cost metrics and analysis' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Cost metrics retrieved successfully' })
  async getCostMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: DateRangeQuery = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const metrics = await this.analyticsService.getCostMetrics(query);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('technicians/productivity')
  @ApiOperation({ summary: 'Get technician productivity metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Technician productivity metrics retrieved successfully' })
  async getTechnicianProductivity(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: DateRangeQuery = {};
    if (startDate) query.startDate = new Date(startDate);
    if (endDate) query.endDate = new Date(endDate);

    const metrics = await this.analyticsService.getTechnicianProductivity(query);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats() {
    const stats = await this.analyticsService.getUserStats();
    return {
      success: true,
      data: stats,
    };
  }
}
