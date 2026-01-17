import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '@app/database/entities/site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private sitesRepository: Repository<Site>,
  ) {}

  async create(createSiteDto: CreateSiteDto): Promise<Site> {
    // Generate code if not provided
    if (!createSiteDto.code) {
      const count = await this.sitesRepository.count();
      createSiteDto.code = `SITE-${String(count + 1).padStart(4, '0')}`;
    }

    const site = this.sitesRepository.create(createSiteDto);
    return this.sitesRepository.save(site);
  }

  async findAll(organizationId?: string, clientId?: string): Promise<Site[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    return this.sitesRepository.find({
      where,
      relations: ['organization', 'client', 'assignedUser', 'sla'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.sitesRepository.findOne({
      where: { id },
      relations: ['organization', 'client', 'assignedUser', 'sla'],
    });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }
    return site;
  }

  async update(id: string, updateSiteDto: UpdateSiteDto): Promise<Site> {
    const site = await this.findOne(id);
    Object.assign(site, updateSiteDto);
    return this.sitesRepository.save(site);
  }

  async remove(id: string): Promise<void> {
    const site = await this.findOne(id);
    await this.sitesRepository.remove(site);
  }

  async count(organizationId?: string): Promise<number> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.sitesRepository.count({ where });
  }

  async findByClient(clientId: string): Promise<Site[]> {
    return this.sitesRepository.find({
      where: { clientId },
      relations: ['organization', 'client', 'assignedUser', 'sla'],
      order: { name: 'ASC' },
    });
  }

  async assignUser(siteId: string, assignedUserId: string | null): Promise<Site> {
    const site = await this.findOne(siteId);
    site.assignedUserId = assignedUserId;
    return this.sitesRepository.save(site);
  }
}
