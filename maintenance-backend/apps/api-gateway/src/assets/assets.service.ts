import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '@app/database/entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    private readonly auditService: AuditService,
  ) {}

  async create(createAssetDto: CreateAssetDto, userId?: string): Promise<Asset> {
    const asset = this.assetsRepository.create(createAssetDto);
    const saved = await this.assetsRepository.save(asset);

    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'CREATE',
        'Asset',
        saved.id,
        { created: { name: createAssetDto.name, assetCode: createAssetDto.assetCode, type: createAssetDto.type } },
      );
    }

    return saved;
  }

  async findAll(organizationId?: string): Promise<Asset[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.assetsRepository.find({
      where,
      relations: ['organization'],
    });
  }

  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetsRepository.findOne({
      where: { id },
      relations: ['organization', 'location'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, userId?: string): Promise<Asset> {
    const asset = await this.findOne(id);
    const oldData = { name: asset.name, assetCode: asset.assetCode, type: asset.type, status: asset.status };

    Object.assign(asset, updateAssetDto);
    const saved = await this.assetsRepository.save(asset);

    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'UPDATE',
        'Asset',
        id,
        { before: oldData, after: updateAssetDto },
      );
    }

    return saved;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const asset = await this.findOne(id);
    const deletedData = { name: asset.name, assetCode: asset.assetCode, type: asset.type };

    await this.assetsRepository.remove(asset);

    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'DELETE',
        'Asset',
        id,
        { deleted: deletedData },
      );
    }
  }
}
