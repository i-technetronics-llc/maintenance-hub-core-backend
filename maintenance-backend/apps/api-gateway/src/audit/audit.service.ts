import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@app/database/entities/audit-log.entity';

interface FindAllOptions {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateAuditLogDto {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(options: FindAllOptions = {}): Promise<PaginatedResult<AuditLog>> {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      entityType,
      startDate,
      endDate,
      search
    } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .select([
        'audit.auditId',
        'audit.userId',
        'audit.action',
        'audit.entityType',
        'audit.entityId',
        'audit.changes',
        'audit.ipAddress',
        'audit.userAgent',
        'audit.timestamp',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
      ]);

    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }

    if (entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', { entityType });
    }

    if (startDate) {
      queryBuilder.andWhere('audit.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.timestamp <= :endDate', { endDate });
    }

    if (search) {
      queryBuilder.andWhere(
        '(audit.action ILIKE :search OR audit.entityType ILIKE :search OR audit.entityId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('audit.timestamp', 'DESC');

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

  async findOne(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { auditId: id },
      relations: ['user'],
    });
  }

  async getActions(): Promise<string[]> {
    const result = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.action', 'action')
      .orderBy('audit.action', 'ASC')
      .getRawMany();
    return result.map(r => r.action);
  }

  async getEntityTypes(): Promise<string[]> {
    const result = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.entityType', 'entityType')
      .orderBy('audit.entityType', 'ASC')
      .getRawMany();
    return result.map(r => r.entityType);
  }

  async log(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.create({
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      userAgent,
    });
  }
}
