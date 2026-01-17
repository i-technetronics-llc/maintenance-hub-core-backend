import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { RescheduleWorkOrderDto } from './dto/reschedule-work-order.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  companyId?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private workOrdersRepository: Repository<WorkOrder>,
  ) {}

  async create(createWorkOrderDto: CreateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = this.workOrdersRepository.create(createWorkOrderDto);
    return this.workOrdersRepository.save(workOrder);
  }

  async findAll(options: FindAllOptions = {}): Promise<PaginatedResult<WorkOrder>> {
    const { page = 1, limit = 10, status, priority, search, companyId } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.workOrdersRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.createdBy', 'createdBy')
      .leftJoinAndSelect('workOrder.clientOrganization', 'clientOrganization')
      .leftJoinAndSelect('workOrder.vendorOrganization', 'vendorOrganization');

    if (status) {
      queryBuilder.andWhere('workOrder.status = :status', { status: status.toUpperCase() });
    }

    if (priority) {
      queryBuilder.andWhere('workOrder.priority = :priority', { priority: priority.toUpperCase() });
    }

    if (companyId) {
      queryBuilder.andWhere('workOrder.clientOrgId = :companyId', { companyId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(workOrder.title ILIKE :search OR workOrder.woNumber ILIKE :search OR workOrder.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('workOrder.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrdersRepository.findOne({
      where: { id },
      relations: ['asset', 'assignedTo', 'createdBy', 'attachments', 'clientOrganization', 'vendorOrganization'],
    });

    if (!workOrder) {
      throw new NotFoundException(`Work Order with ID ${id} not found`);
    }

    return workOrder;
  }

  async update(id: string, updateWorkOrderDto: UpdateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    Object.assign(workOrder, updateWorkOrderDto);
    return this.workOrdersRepository.save(workOrder);
  }

  async remove(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrdersRepository.remove(workOrder);
  }

  async reschedule(id: string, rescheduleDto: RescheduleWorkOrderDto): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);

    // Parse the new scheduled date
    const newScheduledDate = new Date(rescheduleDto.scheduledDate);

    // Check for conflicts if a technician is specified
    const technicianId = rescheduleDto.assignedToId || workOrder.assignedToId;
    if (technicianId) {
      const conflicts = await this.findConflicts(newScheduledDate, technicianId, id);
      if (conflicts.length > 0) {
        // Log conflict but allow scheduling (soft conflict detection)
        console.warn(`Scheduling conflict detected for technician ${technicianId} on ${newScheduledDate}: ${conflicts.length} other work orders`);
      }
    }

    // Update the work order
    workOrder.scheduledDate = newScheduledDate;
    if (rescheduleDto.assignedToId) {
      workOrder.assignedToId = rescheduleDto.assignedToId;
    }

    return this.workOrdersRepository.save(workOrder);
  }

  private async findConflicts(date: Date, technicianId: string, excludeWorkOrderId?: string): Promise<WorkOrder[]> {
    // Get the start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const queryBuilder = this.workOrdersRepository
      .createQueryBuilder('workOrder')
      .where('workOrder.assignedToId = :technicianId', { technicianId })
      .andWhere(
        '(workOrder.scheduledDate BETWEEN :startOfDay AND :endOfDay OR workOrder.dueDate BETWEEN :startOfDay AND :endOfDay)',
        { startOfDay, endOfDay }
      );

    if (excludeWorkOrderId) {
      queryBuilder.andWhere('workOrder.id != :excludeId', { excludeId: excludeWorkOrderId });
    }

    return queryBuilder.getMany();
  }

  async checkConflicts(date: string, technicianId?: string): Promise<{
    hasConflicts: boolean;
    conflicts: WorkOrder[];
    date: string;
    technicianId?: string;
  }> {
    const checkDate = new Date(date);

    if (technicianId) {
      const conflicts = await this.findConflicts(checkDate, technicianId);
      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        date,
        technicianId,
      };
    }

    // Get all work orders for the date and find technicians with multiple assignments
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    const workOrders = await this.workOrdersRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .where(
        '(workOrder.scheduledDate BETWEEN :startOfDay AND :endOfDay OR workOrder.dueDate BETWEEN :startOfDay AND :endOfDay)',
        { startOfDay, endOfDay }
      )
      .getMany();

    // Group by technician and find conflicts
    const technicianWorkloads: Record<string, WorkOrder[]> = {};
    workOrders.forEach((wo) => {
      if (wo.assignedToId) {
        if (!technicianWorkloads[wo.assignedToId]) {
          technicianWorkloads[wo.assignedToId] = [];
        }
        technicianWorkloads[wo.assignedToId].push(wo);
      }
    });

    const conflicts: WorkOrder[] = [];
    Object.values(technicianWorkloads).forEach((wos) => {
      if (wos.length > 3) { // More than 3 work orders per day is a potential conflict
        conflicts.push(...wos);
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      date,
    };
  }

  async getCalendarView(startDate: string, endDate: string, technicianId?: string): Promise<{
    workOrders: WorkOrder[];
    dateRange: { start: string; end: string };
    technicianId?: string;
    summary: {
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
    };
  }> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const queryBuilder = this.workOrdersRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.clientOrganization', 'clientOrganization')
      .where(
        '(workOrder.scheduledDate BETWEEN :start AND :end OR workOrder.dueDate BETWEEN :start AND :end)',
        { start, end }
      );

    if (technicianId) {
      queryBuilder.andWhere('workOrder.assignedToId = :technicianId', { technicianId });
    }

    const workOrders = await queryBuilder.orderBy('workOrder.scheduledDate', 'ASC').getMany();

    // Calculate summary
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    workOrders.forEach((wo) => {
      byStatus[wo.status] = (byStatus[wo.status] || 0) + 1;
      byPriority[wo.priority] = (byPriority[wo.priority] || 0) + 1;
    });

    return {
      workOrders,
      dateRange: { start: startDate, end: endDate },
      technicianId,
      summary: {
        total: workOrders.length,
        byStatus,
        byPriority,
      },
    };
  }
}
