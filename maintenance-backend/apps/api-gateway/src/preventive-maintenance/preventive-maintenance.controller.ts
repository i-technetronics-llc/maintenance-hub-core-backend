import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { PreventiveMaintenanceService } from './preventive-maintenance.service';
import { CreatePMScheduleDto, UpdatePMScheduleDto } from './dto';

@ApiTags('Preventive Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('preventive-maintenance')
export class PreventiveMaintenanceController {
  constructor(private readonly pmService: PreventiveMaintenanceService) {}

  // PM Schedule endpoints
  @Post('schedules')
  @ApiOperation({ summary: 'Create a new PM schedule' })
  @ApiResponse({ status: 201, description: 'PM schedule created successfully' })
  async createSchedule(@Body() createDto: CreatePMScheduleDto) {
    return await this.pmService.create(createDto);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Get all PM schedules' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 200, description: 'List of PM schedules' })
  async findAllSchedules(@Query('organizationId') organizationId?: string) {
    return await this.pmService.findAll(organizationId);
  }

  @Get('schedules/overdue')
  @ApiOperation({ summary: 'Get overdue PM schedules' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 200, description: 'List of overdue PM schedules' })
  async getOverdueSchedules(@Query('organizationId') organizationId?: string) {
    return await this.pmService.getOverduePMs(organizationId);
  }

  @Get('schedules/upcoming')
  @ApiOperation({ summary: 'Get upcoming PM schedules' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead (default 7)' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 200, description: 'List of upcoming PM schedules' })
  async getUpcomingSchedules(
    @Query('days') days?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return await this.pmService.getUpcomingPMs(daysNum, organizationId);
  }

  @Get('compliance')
  @ApiOperation({ summary: 'Get PM compliance metrics' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 200, description: 'PM compliance metrics' })
  async getComplianceMetrics(@Query('organizationId') organizationId?: string) {
    return await this.pmService.getComplianceMetrics(organizationId);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get a PM schedule by ID' })
  @ApiResponse({ status: 200, description: 'PM schedule details' })
  @ApiResponse({ status: 404, description: 'PM schedule not found' })
  async findOneSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return await this.pmService.findOne(id);
  }

  @Patch('schedules/:id')
  @ApiOperation({ summary: 'Update a PM schedule' })
  @ApiResponse({ status: 200, description: 'PM schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'PM schedule not found' })
  async updateSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePMScheduleDto,
  ) {
    return await this.pmService.update(id, updateDto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a PM schedule' })
  @ApiResponse({ status: 204, description: 'PM schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'PM schedule not found' })
  async removeSchedule(@Param('id', ParseUUIDPipe) id: string) {
    await this.pmService.remove(id);
  }

  @Post('schedules/:id/generate-work-order')
  @ApiOperation({ summary: 'Manually generate a work order for a PM schedule' })
  @ApiResponse({ status: 201, description: 'Work order generated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot generate work order' })
  @ApiResponse({ status: 404, description: 'PM schedule not found' })
  async generateWorkOrder(@Param('id', ParseUUIDPipe) id: string) {
    return await this.pmService.generateWorkOrder(id);
  }

  @Get('schedules/:id/history')
  @ApiOperation({ summary: 'Get execution history for a PM schedule' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results (default 50)' })
  @ApiResponse({ status: 200, description: 'List of execution history' })
  async getExecutionHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.pmService.getExecutionHistory(id, limitNum);
  }

  @Post('executions/:id/complete')
  @ApiOperation({ summary: 'Mark a PM execution as completed' })
  @ApiResponse({ status: 200, description: 'Execution marked as completed' })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  async markExecutionCompleted(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { completedDate?: string },
  ) {
    const completedDate = body.completedDate ? new Date(body.completedDate) : undefined;
    return await this.pmService.markExecutionCompleted(id, completedDate);
  }

  // PM Task Library endpoints
  @Post('tasks')
  @ApiOperation({ summary: 'Create a new PM task template' })
  @ApiResponse({ status: 201, description: 'PM task created successfully' })
  async createTask(@Body() taskData: any) {
    return await this.pmService.createTask(taskData);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all PM task templates' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 200, description: 'List of PM tasks' })
  async findAllTasks(@Query('organizationId') organizationId?: string) {
    return await this.pmService.findAllTasks(organizationId);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get a PM task by ID' })
  @ApiResponse({ status: 200, description: 'PM task details' })
  @ApiResponse({ status: 404, description: 'PM task not found' })
  async findOneTask(@Param('id', ParseUUIDPipe) id: string) {
    return await this.pmService.findTask(id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a PM task' })
  @ApiResponse({ status: 200, description: 'PM task updated successfully' })
  @ApiResponse({ status: 404, description: 'PM task not found' })
  async updateTask(@Param('id', ParseUUIDPipe) id: string, @Body() updateData: any) {
    return await this.pmService.updateTask(id, updateData);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a PM task' })
  @ApiResponse({ status: 204, description: 'PM task deleted successfully' })
  @ApiResponse({ status: 404, description: 'PM task not found' })
  async removeTask(@Param('id', ParseUUIDPipe) id: string) {
    await this.pmService.removeTask(id);
  }

  // Meter-based and Condition-based PM endpoints
  @Post('process/meter-based')
  @ApiOperation({ summary: 'Manually trigger processing of meter-based PMs' })
  @ApiResponse({
    status: 200,
    description: 'Meter-based PM processing results',
    schema: {
      properties: {
        processed: { type: 'number' },
        triggered: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async processMeterBasedPMs() {
    return await this.pmService.processMeterBasedPMs();
  }

  @Post('process/condition-based')
  @ApiOperation({ summary: 'Manually trigger processing of condition-based PMs' })
  @ApiResponse({
    status: 200,
    description: 'Condition-based PM processing results',
    schema: {
      properties: {
        processed: { type: 'number' },
        triggered: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async processConditionBasedPMs() {
    return await this.pmService.processConditionBasedPMs();
  }

  @Get('meter-based/approaching-due')
  @ApiOperation({ summary: 'Get meter-based PMs approaching their due threshold' })
  @ApiQuery({
    name: 'thresholdPercentage',
    required: false,
    type: Number,
    description: 'Percentage threshold (default 90)',
  })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of meter-based PMs approaching due threshold',
  })
  async getMeterBasedPMsApproachingDue(
    @Query('thresholdPercentage') thresholdPercentage?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const threshold = thresholdPercentage ? parseFloat(thresholdPercentage) : 90;
    return await this.pmService.getMeterBasedPMsApproachingDue(threshold, organizationId);
  }
}
