import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { RescheduleWorkOrderDto } from './dto/reschedule-work-order.dto';
import { JwtAuthGuard } from '@app/common/guards';

@ApiTags('work-orders')
@Controller('work-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work order' })
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work orders with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.workOrdersService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
      priority,
      search,
      companyId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work order by ID' })
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work order' })
  update(@Param('id') id: string, @Body() updateWorkOrderDto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work order' })
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a work order to a new date' })
  @ApiResponse({ status: 200, description: 'Work order rescheduled successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  @ApiResponse({ status: 409, description: 'Scheduling conflict detected' })
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleWorkOrderDto,
  ) {
    return this.workOrdersService.reschedule(id, rescheduleDto);
  }

  @Get('scheduling/conflicts')
  @ApiOperation({ summary: 'Check for scheduling conflicts' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiQuery({ name: 'technicianId', required: false, type: String })
  checkConflicts(
    @Query('date') date: string,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.workOrdersService.checkConflicts(date, technicianId);
  }

  @Get('scheduling/calendar')
  @ApiOperation({ summary: 'Get work orders for calendar view' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'technicianId', required: false, type: String })
  getCalendarView(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.workOrdersService.getCalendarView(startDate, endDate, technicianId);
  }
}
