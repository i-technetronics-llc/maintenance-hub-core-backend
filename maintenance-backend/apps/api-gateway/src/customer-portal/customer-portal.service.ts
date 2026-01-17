import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ServiceRequest, ServiceRequestStatus, ServiceRequestCategory, ServiceRequestPriority } from '@app/database/entities/service-request.entity';
import { CustomerNotification, CustomerNotificationType } from '@app/database/entities/customer-notification.entity';
import { CustomerAccount } from '@app/database/entities/customer-account.entity';
import { AssetLocation } from '@app/database/entities/asset-location.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { WorkOrderStatus, WorkOrderPriority } from '@app/common/enums';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { RateServiceDto } from './dto/rate-service.dto';

@Injectable()
export class CustomerPortalService {
  constructor(
    @InjectRepository(ServiceRequest)
    private requestRepository: Repository<ServiceRequest>,
    @InjectRepository(CustomerNotification)
    private notificationRepository: Repository<CustomerNotification>,
    @InjectRepository(CustomerAccount)
    private customerRepository: Repository<CustomerAccount>,
    @InjectRepository(AssetLocation)
    private locationRepository: Repository<AssetLocation>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
  ) {}

  async submitRequest(customerId: string, createDto: CreateServiceRequestDto): Promise<ServiceRequest> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['company'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Generate request number
    const requestNumber = await this.generateRequestNumber(customer.companyId);

    // Create service request
    const request = this.requestRepository.create({
      requestNumber,
      customerId,
      companyId: customer.companyId,
      title: createDto.title,
      description: createDto.description,
      category: createDto.category || ServiceRequestCategory.GENERAL,
      priority: createDto.priority,
      locationId: createDto.locationId || customer.locationId,
      assetId: createDto.assetId,
      attachments: createDto.attachments?.map(att => ({
        ...att,
        uploadedAt: new Date(),
      })),
      status: ServiceRequestStatus.SUBMITTED,
      statusHistory: [
        {
          status: ServiceRequestStatus.SUBMITTED,
          changedAt: new Date(),
          changedBy: customer.name,
          notes: 'Request submitted by customer',
        },
      ],
      comments: [],
    });

    const savedRequest = await this.requestRepository.save(request);

    // Create notification for customer
    await this.createNotification(
      customerId,
      savedRequest.id,
      CustomerNotificationType.REQUEST_SUBMITTED,
      'Request Submitted',
      `Your service request "${savedRequest.title}" has been submitted successfully. Request #${savedRequest.requestNumber}`,
    );

    return savedRequest;
  }

  async getRequestById(customerId: string, requestId: string): Promise<ServiceRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['customer', 'location', 'asset', 'workOrder'],
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    // Verify customer owns this request
    if (request.customerId !== customerId) {
      throw new ForbiddenException('You do not have access to this request');
    }

    return request;
  }

  async getCustomerRequests(
    customerId: string,
    options: {
      status?: ServiceRequestStatus;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { status, page = 1, limit = 10 } = options;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.location', 'location')
      .leftJoinAndSelect('request.asset', 'asset')
      .where('request.customerId = :customerId', { customerId });

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    const [requests, total] = await queryBuilder
      .orderBy('request.submittedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addComment(customerId: string, requestId: string, commentDto: AddCommentDto): Promise<ServiceRequest> {
    const request = await this.getRequestById(customerId, requestId);

    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    const newComment = {
      id: uuidv4(),
      authorId: customerId,
      authorName: customer.name,
      authorType: 'customer' as const,
      message: commentDto.message,
      createdAt: new Date(),
    };

    request.comments = [...(request.comments || []), newComment];

    return this.requestRepository.save(request);
  }

  async rateService(customerId: string, requestId: string, rateDto: RateServiceDto): Promise<ServiceRequest> {
    const request = await this.getRequestById(customerId, requestId);

    if (request.status !== ServiceRequestStatus.COMPLETED) {
      throw new BadRequestException('You can only rate completed requests');
    }

    if (request.rating) {
      throw new BadRequestException('This request has already been rated');
    }

    request.rating = rateDto.rating;
    request.feedback = rateDto.feedback;
    request.ratedAt = new Date();

    return this.requestRepository.save(request);
  }

  async getNotifications(
    customerId: string,
    options: {
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { unreadOnly = false, page = 1, limit = 20 } = options;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.customerId = :customerId', { customerId });

    if (unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    const [notifications, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount: unreadOnly ? total : await this.getUnreadCount(customerId),
      },
    };
  }

  async markNotificationAsRead(customerId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, customerId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllNotificationsAsRead(customerId: string) {
    await this.notificationRepository.update(
      { customerId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { message: 'All notifications marked as read' };
  }

  async getServiceCategories() {
    return Object.values(ServiceRequestCategory).map(category => ({
      value: category,
      label: this.formatCategoryLabel(category),
    }));
  }

  async getAvailableLocations(companyId: string) {
    const locations = await this.locationRepository.find({
      where: { clientOrgId: companyId },
      order: { locationName: 'ASC' },
    });

    return locations.map(loc => ({
      id: loc.locationId,
      name: loc.locationName,
      address: loc.address,
    }));
  }

  async getAvailableAssets(companyId: string, locationId?: string) {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.clientOrgId = :companyId', { companyId });

    if (locationId) {
      queryBuilder.andWhere('asset.locationId = :locationId', { locationId });
    }

    const assets = await queryBuilder
      .orderBy('asset.name', 'ASC')
      .getMany();

    return assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      assetCode: asset.assetCode,
      category: asset.category,
    }));
  }

  // Internal method to convert request to work order
  async convertToWorkOrder(requestId: string, assignedToId?: string): Promise<WorkOrder> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['customer', 'location', 'asset'],
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    // Generate work order number
    const woNumber = `WO-SR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create work order from request
    const workOrder = this.workOrderRepository.create({
      woNumber,
      title: request.title,
      description: request.description,
      assetId: request.assetId,
      clientOrgId: request.companyId,
      assignedToId,
      status: WorkOrderStatus.ASSIGNED,
      priority: request.priority === ServiceRequestPriority.URGENT ? WorkOrderPriority.CRITICAL : WorkOrderPriority.MEDIUM,
    } as Partial<WorkOrder>);

    const savedWorkOrder = await this.workOrderRepository.save(workOrder) as WorkOrder;

    // Update request with work order reference
    request.workOrderId = savedWorkOrder.id;
    request.status = ServiceRequestStatus.IN_PROGRESS;
    request.statusHistory = [
      ...(request.statusHistory || []),
      {
        status: ServiceRequestStatus.IN_PROGRESS,
        changedAt: new Date(),
        changedBy: 'System',
        notes: `Work order ${savedWorkOrder.woNumber} created`,
      },
    ];

    await this.requestRepository.save(request);

    // Notify customer
    await this.createNotification(
      request.customerId,
      request.id,
      CustomerNotificationType.WORK_ORDER_ASSIGNED,
      'Work Order Created',
      `A technician has been assigned to your request "${request.title}". We will update you on the progress.`,
    );

    return savedWorkOrder;
  }

  // Helper methods
  private async generateRequestNumber(companyId: string): Promise<string> {
    const date = new Date();
    const prefix = 'SR';
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get count of requests for this company this month
    const count = await this.requestRepository.count({
      where: { companyId },
    });

    const sequence = (count + 1).toString().padStart(4, '0');

    return `${prefix}${year}${month}-${sequence}`;
  }

  private async createNotification(
    customerId: string,
    requestId: string,
    type: CustomerNotificationType,
    title: string,
    message: string,
  ) {
    const notification = this.notificationRepository.create({
      customerId,
      requestId,
      type,
      title,
      message,
    });

    return this.notificationRepository.save(notification);
  }

  private async getUnreadCount(customerId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { customerId, isRead: false },
    });
  }

  private formatCategoryLabel(category: string): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Dashboard stats for customer
  async getDashboardStats(customerId: string) {
    const [total, submitted, inProgress, completed] = await Promise.all([
      this.requestRepository.count({ where: { customerId } }),
      this.requestRepository.count({ where: { customerId, status: ServiceRequestStatus.SUBMITTED } }),
      this.requestRepository.count({ where: { customerId, status: ServiceRequestStatus.IN_PROGRESS } }),
      this.requestRepository.count({ where: { customerId, status: ServiceRequestStatus.COMPLETED } }),
    ]);

    // Get recent requests
    const recentRequests = await this.requestRepository.find({
      where: { customerId },
      order: { submittedAt: 'DESC' },
      take: 5,
      relations: ['location'],
    });

    // Get unread notifications count
    const unreadNotifications = await this.getUnreadCount(customerId);

    return {
      stats: {
        total,
        submitted,
        inProgress,
        completed,
        unreadNotifications,
      },
      recentRequests: recentRequests.map(r => ({
        id: r.id,
        requestNumber: r.requestNumber,
        title: r.title,
        status: r.status,
        category: r.category,
        submittedAt: r.submittedAt,
        location: r.location?.locationName,
      })),
    };
  }
}
