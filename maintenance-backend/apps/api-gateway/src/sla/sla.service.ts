import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SLA, SLACategory, SLAStatus, SLAMetricUnit } from '@app/database/entities/sla.entity';
import { CreateSLADto } from './dto/create-sla.dto';
import { UpdateSLADto } from './dto/update-sla.dto';

@Injectable()
export class SLAService implements OnModuleInit {
  constructor(
    @InjectRepository(SLA)
    private slaRepository: Repository<SLA>,
  ) {}

  async onModuleInit() {
    // Seed default SLAs if none exist
    // Wrap in try-catch in case table doesn't exist yet during initial sync
    try {
      const count = await this.slaRepository.count();
      if (count === 0) {
        await this.seedDefaultSLAs();
      }
    } catch (error) {
      console.log('SLA table not ready yet, skipping seed. Will seed on next restart or manual trigger.');
    }
  }

  private async seedDefaultSLAs() {
    const defaultSLAs: Partial<SLA>[] = [
      {
        name: 'Power Availability SLA',
        code: 'SLA-PWR-001',
        description: 'Ensures consistent power availability across all managed sites',
        category: SLACategory.POWER_AVAILABILITY,
        status: SLAStatus.ACTIVE,
        targetValue: 99.9,
        metricUnit: SLAMetricUnit.PERCENTAGE,
        warningThreshold: 99.5,
        criticalThreshold: 99.0,
        responseTimeHours: 2,
        resolutionTimeHours: 8,
        isDefault: true,
        subItems: [
          { name: 'Generator backup availability', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'UPS system uptime', targetValue: 99.99, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Fuel reserve minimum', description: 'Minimum 72 hours fuel reserve', targetValue: 72, metricUnit: SLAMetricUnit.HOURS, isRequired: true },
          { name: 'Transfer switch response', description: 'Automatic transfer within 10 seconds', targetValue: 10, metricUnit: SLAMetricUnit.MINUTES, isRequired: true },
        ],
      },
      {
        name: 'PPM Completion SLA',
        code: 'SLA-PPM-001',
        description: 'Planned Preventive Maintenance completion targets',
        category: SLACategory.PPM_COMPLETION,
        status: SLAStatus.ACTIVE,
        targetValue: 95,
        metricUnit: SLAMetricUnit.PERCENTAGE,
        warningThreshold: 90,
        criticalThreshold: 85,
        isDefault: true,
        subItems: [
          { name: 'Monthly PPM completion', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Quarterly PPM completion', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Annual PPM completion', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'PPM documentation', description: 'All PPM properly documented', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
        ],
      },
      {
        name: 'CMC Completion SLA',
        code: 'SLA-CMC-001',
        description: 'Corrective Maintenance Completion targets and response times',
        category: SLACategory.CMC_COMPLETION,
        status: SLAStatus.ACTIVE,
        targetValue: 98,
        metricUnit: SLAMetricUnit.PERCENTAGE,
        warningThreshold: 95,
        criticalThreshold: 90,
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        isDefault: true,
        priorityResponseTimes: {
          critical: 1,
          high: 4,
          medium: 8,
          low: 24,
        },
        subItems: [
          { name: 'Critical fault response', targetValue: 1, metricUnit: SLAMetricUnit.HOURS, isRequired: true },
          { name: 'High priority resolution', targetValue: 8, metricUnit: SLAMetricUnit.HOURS, isRequired: true },
          { name: 'First-time fix rate', targetValue: 85, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: false },
          { name: 'Parts availability', targetValue: 95, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
        ],
      },
      {
        name: 'Grid Performance SLA',
        code: 'SLA-GRID-001',
        description: 'Grid stability and performance monitoring targets',
        category: SLACategory.GRID_PERFORMANCE,
        status: SLAStatus.ACTIVE,
        targetValue: 99.5,
        metricUnit: SLAMetricUnit.PERCENTAGE,
        warningThreshold: 99,
        criticalThreshold: 98,
        isDefault: true,
        subItems: [
          { name: 'Voltage stability', description: 'Within +/- 5% tolerance', targetValue: 99.5, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Frequency stability', description: 'Within +/- 0.5Hz tolerance', targetValue: 99.5, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Power factor', description: 'Maintain >0.95 power factor', targetValue: 95, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Load balancing', description: 'Phase imbalance <10%', targetValue: 10, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: false },
        ],
      },
      {
        name: 'Grid Fault Maintenance SLA',
        code: 'SLA-FAULT-001',
        description: 'Grid fault response and resolution targets',
        category: SLACategory.GRID_FAULT_MAINTENANCE,
        status: SLAStatus.ACTIVE,
        targetValue: 99,
        metricUnit: SLAMetricUnit.PERCENTAGE,
        warningThreshold: 98,
        criticalThreshold: 95,
        responseTimeHours: 1,
        resolutionTimeHours: 4,
        isDefault: true,
        priorityResponseTimes: {
          critical: 0.5,
          high: 1,
          medium: 4,
          low: 8,
        },
        subItems: [
          { name: 'Fault detection time', description: 'Automatic fault detection', targetValue: 5, metricUnit: SLAMetricUnit.MINUTES, isRequired: true },
          { name: 'Isolation time', description: 'Fault isolation to prevent cascade', targetValue: 15, metricUnit: SLAMetricUnit.MINUTES, isRequired: true },
          { name: 'Service restoration', description: 'Restore power to affected areas', targetValue: 4, metricUnit: SLAMetricUnit.HOURS, isRequired: true },
          { name: 'Root cause analysis', description: 'Complete RCA within 48 hours', targetValue: 48, metricUnit: SLAMetricUnit.HOURS, isRequired: false },
        ],
      },
      {
        name: 'General Housekeeping SLA',
        code: 'SLA-HSK-001',
        description: 'Facility cleanliness and maintenance standards',
        category: SLACategory.GENERAL_HOUSEKEEPING,
        status: SLAStatus.ACTIVE,
        targetValue: 95,
        metricUnit: SLAMetricUnit.PERCENTAGE,
        warningThreshold: 90,
        criticalThreshold: 85,
        isDefault: true,
        subItems: [
          { name: 'Daily cleaning', description: 'All areas cleaned daily', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Equipment room cleanliness', description: 'Equipment rooms dust-free', targetValue: 95, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Waste management', description: 'Proper waste disposal', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
          { name: 'Pest control', description: 'Monthly pest control inspection', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: false },
          { name: 'Landscaping maintenance', description: 'Grounds properly maintained', targetValue: 90, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: false },
          { name: 'Safety equipment check', description: 'Fire extinguishers, first aid kits', targetValue: 100, metricUnit: SLAMetricUnit.PERCENTAGE, isRequired: true },
        ],
      },
    ];

    for (const sla of defaultSLAs) {
      const newSLA = this.slaRepository.create(sla as SLA);
      await this.slaRepository.save(newSLA);
    }

    console.log('Default SLAs seeded successfully');
  }

  async create(createSLADto: CreateSLADto): Promise<SLA> {
    // Generate code if not provided
    if (!createSLADto.code) {
      const count = await this.slaRepository.count();
      createSLADto.code = `SLA-${String(count + 1).padStart(4, '0')}`;
    }

    const sla = this.slaRepository.create(createSLADto);
    return this.slaRepository.save(sla);
  }

  async findAll(organizationId?: string, clientId?: string): Promise<SLA[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (clientId) {
      where.clientId = clientId;
    }

    // If no specific org/client, include default SLAs
    const queryBuilder = this.slaRepository.createQueryBuilder('sla')
      .leftJoinAndSelect('sla.organization', 'organization')
      .leftJoinAndSelect('sla.client', 'client');

    if (organizationId) {
      queryBuilder.where('sla.organizationId = :organizationId OR sla.isDefault = true', { organizationId });
    } else if (clientId) {
      queryBuilder.where('sla.clientId = :clientId', { clientId });
    }

    queryBuilder.orderBy('sla.category', 'ASC')
      .addOrderBy('sla.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<SLA> {
    const sla = await this.slaRepository.findOne({
      where: { id },
      relations: ['organization', 'client'],
    });
    if (!sla) {
      throw new NotFoundException(`SLA with ID ${id} not found`);
    }
    return sla;
  }

  async findByClient(clientId: string): Promise<SLA[]> {
    return this.slaRepository.find({
      where: [
        { clientId },
        { isDefault: true },
      ],
      relations: ['organization', 'client'],
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findDefaults(): Promise<SLA[]> {
    return this.slaRepository.find({
      where: { isDefault: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findByCategory(category: SLACategory, organizationId?: string): Promise<SLA[]> {
    const where: any = { category };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.slaRepository.find({
      where,
      relations: ['organization', 'client'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateSLADto: UpdateSLADto): Promise<SLA> {
    const sla = await this.findOne(id);
    Object.assign(sla, updateSLADto);
    return this.slaRepository.save(sla);
  }

  async remove(id: string): Promise<void> {
    const sla = await this.findOne(id);
    await this.slaRepository.remove(sla);
  }

  async count(organizationId?: string): Promise<number> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.slaRepository.count({ where });
  }

  async getStats(organizationId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
  }> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const slas = await this.slaRepository.find({ where });

    const stats = {
      total: slas.length,
      active: slas.filter(s => s.status === SLAStatus.ACTIVE).length,
      inactive: slas.filter(s => s.status === SLAStatus.INACTIVE).length,
      byCategory: {} as Record<string, number>,
    };

    for (const sla of slas) {
      stats.byCategory[sla.category] = (stats.byCategory[sla.category] || 0) + 1;
    }

    return stats;
  }
}
