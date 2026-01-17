import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { SavedReport, ReportType } from '@app/database/entities/saved-report.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { Inventory } from '@app/database/entities/inventory.entity';
import { PMSchedule } from '@app/database/entities/pm-schedule.entity';
import { User } from '@app/database/entities/user.entity';
import { CreateReportDto, ExecuteReportDto, UpdateReportDto } from './dto';

export interface ReportExecutionResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations?: Record<string, any>;
  metadata: {
    reportName: string;
    executedAt: string;
    dataSource: string;
    columns: string[];
  };
}

// Define available columns for each data source
export const DATA_SOURCE_COLUMNS = {
  work_orders: [
    { field: 'id', label: 'ID', type: 'string' },
    { field: 'woNumber', label: 'WO Number', type: 'string' },
    { field: 'title', label: 'Title', type: 'string' },
    { field: 'type', label: 'Type', type: 'enum' },
    { field: 'priority', label: 'Priority', type: 'enum' },
    { field: 'status', label: 'Status', type: 'enum' },
    { field: 'riskLevel', label: 'Risk Level', type: 'enum' },
    { field: 'urgency', label: 'Urgency', type: 'enum' },
    { field: 'description', label: 'Description', type: 'text' },
    { field: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
    { field: 'dueDate', label: 'Due Date', type: 'date' },
    { field: 'actualStart', label: 'Actual Start', type: 'date' },
    { field: 'actualEnd', label: 'Actual End', type: 'date' },
    { field: 'estimatedCost', label: 'Estimated Cost', type: 'number' },
    { field: 'actualCost', label: 'Actual Cost', type: 'number' },
    { field: 'createdAt', label: 'Created At', type: 'date' },
    { field: 'updatedAt', label: 'Updated At', type: 'date' },
  ],
  assets: [
    { field: 'id', label: 'ID', type: 'string' },
    { field: 'assetCode', label: 'Asset Code', type: 'string' },
    { field: 'name', label: 'Name', type: 'string' },
    { field: 'type', label: 'Type', type: 'string' },
    { field: 'category', label: 'Category', type: 'string' },
    { field: 'status', label: 'Status', type: 'enum' },
    { field: 'criticality', label: 'Criticality', type: 'enum' },
    { field: 'manufacturer', label: 'Manufacturer', type: 'string' },
    { field: 'model', label: 'Model', type: 'string' },
    { field: 'serialNumber', label: 'Serial Number', type: 'string' },
    { field: 'purchasePrice', label: 'Purchase Price', type: 'number' },
    { field: 'currentValue', label: 'Current Value', type: 'number' },
    { field: 'installedDate', label: 'Installed Date', type: 'date' },
    { field: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
    { field: 'lastMaintenanceDate', label: 'Last Maintenance', type: 'date' },
    { field: 'nextMaintenanceDate', label: 'Next Maintenance', type: 'date' },
    { field: 'totalMaintenanceCost', label: 'Total Maintenance Cost', type: 'number' },
    { field: 'createdAt', label: 'Created At', type: 'date' },
  ],
  inventory: [
    { field: 'id', label: 'ID', type: 'string' },
    { field: 'sku', label: 'SKU', type: 'string' },
    { field: 'name', label: 'Name', type: 'string' },
    { field: 'description', label: 'Description', type: 'text' },
    { field: 'category', label: 'Category', type: 'enum' },
    { field: 'quantity', label: 'Quantity', type: 'number' },
    { field: 'minQuantity', label: 'Min Quantity', type: 'number' },
    { field: 'maxQuantity', label: 'Max Quantity', type: 'number' },
    { field: 'unit', label: 'Unit', type: 'string' },
    { field: 'unitPrice', label: 'Unit Price', type: 'number' },
    { field: 'location', label: 'Location', type: 'string' },
    { field: 'supplier', label: 'Supplier', type: 'string' },
    { field: 'manufacturer', label: 'Manufacturer', type: 'string' },
    { field: 'partNumber', label: 'Part Number', type: 'string' },
    { field: 'status', label: 'Status', type: 'enum' },
    { field: 'lastRestockDate', label: 'Last Restock', type: 'date' },
    { field: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { field: 'createdAt', label: 'Created At', type: 'date' },
  ],
  pm_schedules: [
    { field: 'id', label: 'ID', type: 'string' },
    { field: 'name', label: 'Name', type: 'string' },
    { field: 'description', label: 'Description', type: 'text' },
    { field: 'triggerType', label: 'Trigger Type', type: 'enum' },
    { field: 'frequencyType', label: 'Frequency', type: 'enum' },
    { field: 'priority', label: 'Priority', type: 'enum' },
    { field: 'startDate', label: 'Start Date', type: 'date' },
    { field: 'nextDueDate', label: 'Next Due Date', type: 'date' },
    { field: 'lastCompletedDate', label: 'Last Completed', type: 'date' },
    { field: 'estimatedHours', label: 'Estimated Hours', type: 'number' },
    { field: 'isActive', label: 'Is Active', type: 'boolean' },
    { field: 'completedCount', label: 'Completed Count', type: 'number' },
    { field: 'missedCount', label: 'Missed Count', type: 'number' },
    { field: 'createdAt', label: 'Created At', type: 'date' },
  ],
  users: [
    { field: 'id', label: 'ID', type: 'string' },
    { field: 'email', label: 'Email', type: 'string' },
    { field: 'firstName', label: 'First Name', type: 'string' },
    { field: 'lastName', label: 'Last Name', type: 'string' },
    { field: 'phone', label: 'Phone', type: 'string' },
    { field: 'status', label: 'Status', type: 'enum' },
    { field: 'isActive', label: 'Is Active', type: 'boolean' },
    { field: 'emailVerified', label: 'Email Verified', type: 'boolean' },
    { field: 'twoFactorEnabled', label: '2FA Enabled', type: 'boolean' },
    { field: 'lastLoginAt', label: 'Last Login', type: 'date' },
    { field: 'createdAt', label: 'Created At', type: 'date' },
  ],
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SavedReport)
    private reportRepository: Repository<SavedReport>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(PMSchedule)
    private pmScheduleRepository: Repository<PMSchedule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createReportDto: CreateReportDto, userId: string, companyId: string): Promise<SavedReport> {
    // Map dataSource to reportType if needed
    const reportType = createReportDto.dataSource ?
      this.mapDataSourceToReportType(createReportDto.dataSource) :
      createReportDto.reportType;

    const report = this.reportRepository.create({
      name: createReportDto.name,
      description: createReportDto.description,
      reportType,
      isPublic: createReportDto.isPublic || false,
      isScheduled: createReportDto.isScheduled || false,
      scheduleFrequency: createReportDto.scheduleFrequency,
      scheduleRecipients: createReportDto.scheduleRecipients,
      scheduleTime: createReportDto.scheduleTime,
      scheduleDayOfWeek: createReportDto.scheduleDayOfWeek,
      scheduleDayOfMonth: createReportDto.scheduleDayOfMonth,
      configuration: {
        columns: createReportDto.configuration.columns,
        filters: createReportDto.configuration.filters ?
          createReportDto.configuration.filters.reduce((acc, f) => {
            acc[f.field] = { operator: f.operator, value: f.value };
            return acc;
          }, {} as Record<string, any>) : {},
        sorting: createReportDto.configuration.sorting || [],
        groupBy: createReportDto.configuration.groupBy,
        aggregations: createReportDto.configuration.aggregations,
        chartType: createReportDto.configuration.chartType,
        dateRange: createReportDto.configuration.dateRange,
      },
      createdById: userId,
      companyId,
    });

    return this.reportRepository.save(report);
  }

  private mapDataSourceToReportType(dataSource: string): ReportType {
    const mapping: Record<string, ReportType> = {
      'work_orders': ReportType.WORK_ORDER,
      'work_order': ReportType.WORK_ORDER,
      'assets': ReportType.ASSET,
      'asset': ReportType.ASSET,
      'inventory': ReportType.INVENTORY,
      'pm_schedules': ReportType.PREVENTIVE_MAINTENANCE,
      'preventive_maintenance': ReportType.PREVENTIVE_MAINTENANCE,
      'users': ReportType.CUSTOM,
      'custom': ReportType.CUSTOM,
    };
    return mapping[dataSource] || ReportType.CUSTOM;
  }

  async findAll(userId: string, companyId: string): Promise<SavedReport[]> {
    return this.reportRepository.find({
      where: [
        { createdById: userId },
        { companyId, isPublic: true },
      ],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, companyId: string): Promise<SavedReport> {
    const report = await this.reportRepository.findOne({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    // Check access: user owns it, or it's public in their company
    if (report.createdById !== userId && !(report.companyId === companyId && report.isPublic)) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto, userId: string, companyId: string): Promise<SavedReport> {
    const report = await this.findOne(id, userId, companyId);

    if (report.createdById !== userId) {
      throw new ForbiddenException('Only the report creator can update it');
    }

    // Handle configuration update
    if (updateReportDto.configuration) {
      const config = updateReportDto.configuration;
      report.configuration = {
        columns: config.columns || report.configuration.columns,
        filters: config.filters ?
          config.filters.reduce((acc, f) => {
            acc[f.field] = { operator: f.operator, value: f.value };
            return acc;
          }, {} as Record<string, any>) : report.configuration.filters,
        sorting: config.sorting || report.configuration.sorting,
        groupBy: config.groupBy || report.configuration.groupBy,
        aggregations: config.aggregations || report.configuration.aggregations,
        chartType: config.chartType || report.configuration.chartType,
        dateRange: config.dateRange || report.configuration.dateRange,
      };
      delete updateReportDto.configuration;
    }

    Object.assign(report, updateReportDto);
    return this.reportRepository.save(report);
  }

  async remove(id: string, userId: string, companyId: string): Promise<void> {
    const report = await this.findOne(id, userId, companyId);

    if (report.createdById !== userId) {
      throw new ForbiddenException('Only the report creator can delete it');
    }

    await this.reportRepository.remove(report);
  }

  async execute(
    id: string,
    executeDto: ExecuteReportDto,
    userId: string,
    companyId: string,
  ): Promise<ReportExecutionResult> {
    const report = await this.findOne(id, userId, companyId);
    return this.executeReportConfig(report, executeDto, companyId);
  }

  async executeReportConfig(
    report: SavedReport,
    executeDto: ExecuteReportDto,
    companyId: string,
  ): Promise<ReportExecutionResult> {
    const page = executeDto.page || 1;
    const limit = executeDto.limit || 50;
    const offset = (page - 1) * limit;

    // Get the repository for the data source
    const repository = this.getRepositoryForDataSource(report.reportType);
    const tableName = this.getTableNameForDataSource(report.reportType);

    // Build query
    let queryBuilder = repository.createQueryBuilder(tableName);

    // Apply company filter for data isolation
    if (tableName === 'work_orders') {
      // Work orders are filtered by client org
      // For now, we'll get all for the company
    } else if (tableName === 'users') {
      queryBuilder = queryBuilder.where(`${tableName}.companyId = :companyId`, { companyId });
    } else if (tableName !== 'pm_schedules') {
      queryBuilder = queryBuilder.where(`${tableName}.organizationId IS NOT NULL`);
    }

    // Apply filters from configuration
    const filters = report.configuration.filters || {};
    for (const [field, config] of Object.entries(filters)) {
      const filterConfig = config as { operator: string; value: any };
      queryBuilder = this.applyFilter(queryBuilder, tableName, field, filterConfig.operator, filterConfig.value);
    }

    // Apply override filters
    if (executeDto.overrideFilters) {
      for (const [field, config] of Object.entries(executeDto.overrideFilters)) {
        const filterConfig = config as { operator: string; value: any };
        queryBuilder = this.applyFilter(queryBuilder, tableName, field, filterConfig.operator, filterConfig.value);
      }
    }

    // Apply date range
    const dateRange = executeDto.dateRange || report.configuration.dateRange;
    if (dateRange) {
      queryBuilder = queryBuilder
        .andWhere(`${tableName}.createdAt >= :startDate`, { startDate: dateRange.start })
        .andWhere(`${tableName}.createdAt <= :endDate`, { endDate: dateRange.end });
    }

    // Apply sorting
    const sorting = report.configuration.sorting || [];
    for (const sort of sorting) {
      queryBuilder = queryBuilder.addOrderBy(`${tableName}.${sort.field}`, sort.order.toUpperCase() as 'ASC' | 'DESC');
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder = queryBuilder.skip(offset).take(limit);

    // Execute query
    const rawData = await queryBuilder.getMany();

    // Select only requested columns
    const columns = report.configuration.columns;
    const data = rawData.map(row => {
      const filteredRow: Record<string, any> = {};
      for (const col of columns) {
        filteredRow[col] = (row as any)[col];
      }
      return filteredRow;
    });

    // Calculate aggregations if requested
    let aggregations: Record<string, any> | undefined;
    if (report.configuration.aggregations && report.configuration.aggregations.length > 0) {
      aggregations = await this.calculateAggregations(
        repository,
        tableName,
        report.configuration.aggregations,
        filters,
        dateRange,
      );
    }

    // Update last generated timestamp
    await this.reportRepository.update(report.id, { lastGeneratedAt: new Date() });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      aggregations,
      metadata: {
        reportName: report.name,
        executedAt: new Date().toISOString(),
        dataSource: report.reportType,
        columns,
      },
    };
  }

  private getRepositoryForDataSource(reportType: ReportType): Repository<any> {
    switch (reportType) {
      case ReportType.WORK_ORDER:
        return this.workOrderRepository;
      case ReportType.ASSET:
        return this.assetRepository;
      case ReportType.INVENTORY:
        return this.inventoryRepository;
      case ReportType.PREVENTIVE_MAINTENANCE:
        return this.pmScheduleRepository;
      case ReportType.CUSTOM:
      default:
        return this.workOrderRepository; // Default to work orders
    }
  }

  private getTableNameForDataSource(reportType: ReportType): string {
    switch (reportType) {
      case ReportType.WORK_ORDER:
        return 'work_orders';
      case ReportType.ASSET:
        return 'assets';
      case ReportType.INVENTORY:
        return 'inventory';
      case ReportType.PREVENTIVE_MAINTENANCE:
        return 'pm_schedules';
      case ReportType.CUSTOM:
      default:
        return 'work_orders';
    }
  }

  private applyFilter(
    queryBuilder: SelectQueryBuilder<any>,
    tableName: string,
    field: string,
    operator: string,
    value: any,
  ): SelectQueryBuilder<any> {
    const paramName = `${field}_${Date.now()}`;

    switch (operator) {
      case 'eq':
        return queryBuilder.andWhere(`${tableName}.${field} = :${paramName}`, { [paramName]: value });
      case 'neq':
        return queryBuilder.andWhere(`${tableName}.${field} != :${paramName}`, { [paramName]: value });
      case 'gt':
        return queryBuilder.andWhere(`${tableName}.${field} > :${paramName}`, { [paramName]: value });
      case 'gte':
        return queryBuilder.andWhere(`${tableName}.${field} >= :${paramName}`, { [paramName]: value });
      case 'lt':
        return queryBuilder.andWhere(`${tableName}.${field} < :${paramName}`, { [paramName]: value });
      case 'lte':
        return queryBuilder.andWhere(`${tableName}.${field} <= :${paramName}`, { [paramName]: value });
      case 'like':
        return queryBuilder.andWhere(`${tableName}.${field} ILIKE :${paramName}`, { [paramName]: `%${value}%` });
      case 'in':
        return queryBuilder.andWhere(`${tableName}.${field} IN (:...${paramName})`, { [paramName]: Array.isArray(value) ? value : [value] });
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return queryBuilder
            .andWhere(`${tableName}.${field} >= :${paramName}_start`, { [`${paramName}_start`]: value[0] })
            .andWhere(`${tableName}.${field} <= :${paramName}_end`, { [`${paramName}_end`]: value[1] });
        }
        return queryBuilder;
      default:
        return queryBuilder;
    }
  }

  private async calculateAggregations(
    repository: Repository<any>,
    tableName: string,
    aggregations: Array<{ field: string; function: string }>,
    filters: Record<string, any>,
    dateRange?: { start: string; end: string },
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const agg of aggregations) {
      let qb = repository.createQueryBuilder(tableName);

      // Apply filters
      for (const [field, config] of Object.entries(filters)) {
        const filterConfig = config as { operator: string; value: any };
        qb = this.applyFilter(qb, tableName, field, filterConfig.operator, filterConfig.value);
      }

      // Apply date range
      if (dateRange) {
        qb = qb
          .andWhere(`${tableName}.createdAt >= :startDate`, { startDate: dateRange.start })
          .andWhere(`${tableName}.createdAt <= :endDate`, { endDate: dateRange.end });
      }

      let aggResult: any;
      switch (agg.function) {
        case 'count':
          aggResult = await qb.getCount();
          break;
        case 'sum':
          const sumResult = await qb.select(`SUM(${tableName}.${agg.field})`, 'sum').getRawOne();
          aggResult = parseFloat(sumResult?.sum || 0);
          break;
        case 'avg':
          const avgResult = await qb.select(`AVG(${tableName}.${agg.field})`, 'avg').getRawOne();
          aggResult = parseFloat(avgResult?.avg || 0);
          break;
        case 'min':
          const minResult = await qb.select(`MIN(${tableName}.${agg.field})`, 'min').getRawOne();
          aggResult = minResult?.min;
          break;
        case 'max':
          const maxResult = await qb.select(`MAX(${tableName}.${agg.field})`, 'max').getRawOne();
          aggResult = maxResult?.max;
          break;
      }

      result[`${agg.function}_${agg.field}`] = aggResult;
    }

    return result;
  }

  getAvailableDataSources(): { value: string; label: string }[] {
    return [
      { value: 'work_order', label: 'Work Orders' },
      { value: 'asset', label: 'Assets' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'preventive_maintenance', label: 'PM Schedules' },
      { value: 'custom', label: 'Users' },
    ];
  }

  getColumnsForDataSource(dataSource: string): Array<{ field: string; label: string; type: string }> {
    const mapping: Record<string, keyof typeof DATA_SOURCE_COLUMNS> = {
      'work_order': 'work_orders',
      'asset': 'assets',
      'inventory': 'inventory',
      'preventive_maintenance': 'pm_schedules',
      'custom': 'users',
    };

    const key = mapping[dataSource] || 'work_orders';
    return DATA_SOURCE_COLUMNS[key];
  }
}
