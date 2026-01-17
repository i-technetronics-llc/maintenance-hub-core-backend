import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrdersService } from './work-orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { NotFoundException } from '@nestjs/common';
import { WorkOrderPriority, WorkOrderStatus } from '@app/common/enums';

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let workOrderRepository: any;

  const mockWorkOrder = {
    id: 'wo-123',
    woNumber: 'WO-001',
    title: 'Test Work Order',
    description: 'Test Description',
    status: 'OPEN',
    priority: 'HIGH',
    assetId: 'asset-123',
    assignedToId: 'user-123',
    clientOrgId: 'company-123',
    scheduledDate: new Date('2024-01-15'),
    dueDate: new Date('2024-01-20'),
    createdAt: new Date(),
    asset: { id: 'asset-123', name: 'Test Asset' },
    assignedTo: { id: 'user-123', firstName: 'John', lastName: 'Doe' },
    createdBy: { id: 'admin-123', firstName: 'Admin', lastName: 'User' },
    clientOrganization: { id: 'company-123', name: 'Test Company' },
    vendorOrganization: null,
    attachments: [],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const mockWorkOrderRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: mockWorkOrderRepository,
        },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
    workOrderRepository = module.get(getRepositoryToken(WorkOrder));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a work order successfully', async () => {
      const createDto = {
        title: 'New Work Order',
        description: 'Description',
        priority: WorkOrderPriority.HIGH,
        assetId: 'asset-123',
      };

      workOrderRepository.create.mockReturnValue({ ...createDto, id: 'new-wo-id' });
      workOrderRepository.save.mockResolvedValue({ ...createDto, id: 'new-wo-id' });

      const result = await service.create(createDto);

      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Work Order');
      expect(workOrderRepository.create).toHaveBeenCalledWith(createDto);
      expect(workOrderRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated work orders', async () => {
      const workOrders = [mockWorkOrder, { ...mockWorkOrder, id: 'wo-456' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([workOrders, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status when provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockWorkOrder], 1]);

      await service.findAll({ status: 'OPEN' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'workOrder.status = :status',
        { status: 'OPEN' },
      );
    });

    it('should filter by priority when provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockWorkOrder], 1]);

      await service.findAll({ priority: 'HIGH' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'workOrder.priority = :priority',
        { priority: 'HIGH' },
      );
    });

    it('should filter by companyId when provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockWorkOrder], 1]);

      await service.findAll({ companyId: 'company-123' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'workOrder.clientOrgId = :companyId',
        { companyId: 'company-123' },
      );
    });

    it('should search by title, woNumber, or description when provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockWorkOrder], 1]);

      await service.findAll({ search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(workOrder.title ILIKE :search OR workOrder.woNumber ILIKE :search OR workOrder.description ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('should return default pagination when no options provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockWorkOrder], 1]);

      const result = await service.findAll();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a work order by id', async () => {
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);

      const result = await service.findOne('wo-123');

      expect(result).toEqual(mockWorkOrder);
      expect(workOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'wo-123' },
        relations: ['asset', 'assignedTo', 'createdBy', 'attachments', 'clientOrganization', 'vendorOrganization'],
      });
    });

    it('should throw NotFoundException when work order not found', async () => {
      workOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a work order successfully', async () => {
      const updateDto = { status: WorkOrderStatus.IN_PROGRESS, notes: 'Started work' };

      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);
      workOrderRepository.save.mockResolvedValue({ ...mockWorkOrder, ...updateDto });

      const result = await service.update('wo-123', updateDto);

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(workOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when work order not found', async () => {
      workOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { status: WorkOrderStatus.CLOSED }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a work order successfully', async () => {
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);
      workOrderRepository.remove.mockResolvedValue(mockWorkOrder);

      await service.remove('wo-123');

      expect(workOrderRepository.remove).toHaveBeenCalledWith(mockWorkOrder);
    });

    it('should throw NotFoundException when work order not found', async () => {
      workOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('reschedule', () => {
    it('should reschedule a work order successfully', async () => {
      const rescheduleDto = {
        scheduledDate: '2024-02-01',
      };

      workOrderRepository.findOne.mockResolvedValue({ ...mockWorkOrder, assignedToId: null });
      workOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        scheduledDate: new Date(rescheduleDto.scheduledDate),
      });

      const result = await service.reschedule('wo-123', rescheduleDto);

      expect(result).toBeDefined();
      expect(workOrderRepository.save).toHaveBeenCalled();
    });

    it('should reschedule with new assignedToId', async () => {
      const rescheduleDto = {
        scheduledDate: '2024-02-01',
        assignedToId: 'new-tech-123',
      };

      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      workOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        scheduledDate: new Date(rescheduleDto.scheduledDate),
        assignedToId: 'new-tech-123',
      });

      const result = await service.reschedule('wo-123', rescheduleDto);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when work order not found', async () => {
      workOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.reschedule('nonexistent', { scheduledDate: '2024-02-01' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('checkConflicts', () => {
    it('should return no conflicts when none exist', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.checkConflicts('2024-02-01', 'tech-123');

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toEqual([]);
    });

    it('should return conflicts when they exist', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockWorkOrder]);

      const result = await service.checkConflicts('2024-01-15', 'user-123');

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBe(1);
    });
  });

  describe('getCalendarView', () => {
    it('should return calendar view with work orders', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockWorkOrder]);

      const result = await service.getCalendarView('2024-01-01', '2024-01-31');

      expect(result.workOrders).toBeDefined();
      expect(result.dateRange.start).toBe('2024-01-01');
      expect(result.dateRange.end).toBe('2024-01-31');
      expect(result.summary.total).toBe(1);
    });

    it('should filter by technicianId when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockWorkOrder]);

      const result = await service.getCalendarView('2024-01-01', '2024-01-31', 'tech-123');

      expect(result.technicianId).toBe('tech-123');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'workOrder.assignedToId = :technicianId',
        { technicianId: 'tech-123' },
      );
    });

    it('should calculate summary by status and priority', async () => {
      const workOrders = [
        { ...mockWorkOrder, status: 'OPEN', priority: 'HIGH' },
        { ...mockWorkOrder, id: 'wo-456', status: 'OPEN', priority: 'LOW' },
        { ...mockWorkOrder, id: 'wo-789', status: 'CLOSED', priority: 'HIGH' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(workOrders);

      const result = await service.getCalendarView('2024-01-01', '2024-01-31');

      expect(result.summary.total).toBe(3);
      expect(result.summary.byStatus.OPEN).toBe(2);
      expect(result.summary.byStatus.CLOSED).toBe(1);
      expect(result.summary.byPriority.HIGH).toBe(2);
      expect(result.summary.byPriority.LOW).toBe(1);
    });
  });
});
