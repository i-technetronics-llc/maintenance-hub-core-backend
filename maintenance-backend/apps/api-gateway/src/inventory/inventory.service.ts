import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Inventory } from '@app/database/entities/inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto } from './dto';
import { InventoryStatus } from '@app/common/enums';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly auditService: AuditService,
  ) {}

  async create(createInventoryDto: CreateInventoryDto, userId?: string): Promise<Inventory> {
    // Check if SKU already exists
    if (createInventoryDto.sku) {
      const existingInventory = await this.inventoryRepository.findOne({
        where: { sku: createInventoryDto.sku },
      });

      if (existingInventory) {
        throw new ConflictException(`Inventory with SKU "${createInventoryDto.sku}" already exists`);
      }
    }

    // Auto-generate SKU if not provided
    if (!createInventoryDto.sku) {
      createInventoryDto.sku = await this.generateSku();
    }

    const inventory = this.inventoryRepository.create(createInventoryDto);

    // Set status based on quantity
    inventory.status = this.calculateStatus(inventory.quantity, inventory.minQuantity);

    const saved = await this.inventoryRepository.save(inventory);

    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'CREATE',
        'Inventory',
        saved.id,
        { created: createInventoryDto },
      );
    }

    return saved;
  }

  async findAll(params?: {
    search?: string;
    category?: string;
    status?: string;
    companyId?: string;
    organizationId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Inventory[]; total: number; page: number; limit: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Inventory> = {};

    if (params?.category) {
      where.category = params.category as any;
    }

    if (params?.status) {
      where.status = params.status as InventoryStatus;
    }

    let queryBuilder = this.inventoryRepository.createQueryBuilder('inventory');

    if (params?.search) {
      queryBuilder = queryBuilder.where(
        '(inventory.name ILIKE :search OR inventory.sku ILIKE :search OR inventory.description ILIKE :search OR inventory.partNumber ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    if (params?.category) {
      queryBuilder = queryBuilder.andWhere('inventory.category = :category', {
        category: params.category,
      });
    }

    if (params?.status) {
      queryBuilder = queryBuilder.andWhere('inventory.status = :status', {
        status: params.status,
      });
    }

    // Filter by companyId or organizationId
    if (params?.companyId) {
      queryBuilder = queryBuilder.andWhere('inventory.organizationId = :companyId', {
        companyId: params.companyId,
      });
    } else if (params?.organizationId) {
      queryBuilder = queryBuilder.andWhere('inventory.organizationId = :organizationId', {
        organizationId: params.organizationId,
      });
    }

    const [data, total] = await queryBuilder
      .leftJoinAndSelect('inventory.organization', 'organization')
      .orderBy('inventory.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID "${id}" not found`);
    }

    return inventory;
  }

  async findBySku(sku: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { sku },
      relations: ['organization'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with SKU "${sku}" not found`);
    }

    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto, userId?: string): Promise<Inventory> {
    const inventory = await this.findOne(id);
    const oldData = { ...inventory };

    // Check if updating SKU to a SKU that already exists
    if (updateInventoryDto.sku && updateInventoryDto.sku !== inventory.sku) {
      const existingInventory = await this.inventoryRepository.findOne({
        where: { sku: updateInventoryDto.sku },
      });

      if (existingInventory) {
        throw new ConflictException(`Inventory with SKU "${updateInventoryDto.sku}" already exists`);
      }
    }

    Object.assign(inventory, updateInventoryDto);

    // Update status based on quantity
    if (updateInventoryDto.quantity !== undefined || updateInventoryDto.minQuantity !== undefined) {
      inventory.status = this.calculateStatus(inventory.quantity, inventory.minQuantity);
    }

    const saved = await this.inventoryRepository.save(inventory);

    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'UPDATE',
        'Inventory',
        id,
        { before: oldData, after: updateInventoryDto },
      );
    }

    return saved;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const inventory = await this.findOne(id);
    const deletedData = { ...inventory };

    await this.inventoryRepository.remove(inventory);

    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'DELETE',
        'Inventory',
        id,
        { deleted: deletedData },
      );
    }
  }

  async adjustQuantity(id: string, adjustment: number): Promise<Inventory> {
    const inventory = await this.findOne(id);
    inventory.quantity = Math.max(0, inventory.quantity + adjustment);
    inventory.status = this.calculateStatus(inventory.quantity, inventory.minQuantity);

    if (adjustment > 0) {
      inventory.lastRestockDate = new Date();
    }

    return await this.inventoryRepository.save(inventory);
  }

  async checkAvailability(itemIds: string[]): Promise<{ id: string; available: boolean; quantity: number }[]> {
    const result = [];
    for (const id of itemIds) {
      try {
        const inventory = await this.findOne(id);
        result.push({
          id,
          available: inventory.quantity > 0 && inventory.status === InventoryStatus.ACTIVE,
          quantity: inventory.quantity,
        });
      } catch {
        result.push({
          id,
          available: false,
          quantity: 0,
        });
      }
    }
    return result;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.quantity <= inventory.minQuantity')
      .andWhere('inventory.status != :status', { status: InventoryStatus.DISCONTINUED })
      .orderBy('inventory.quantity', 'ASC')
      .getMany();
  }

  private calculateStatus(quantity: number, minQuantity: number): InventoryStatus {
    if (quantity === 0) {
      return InventoryStatus.OUT_OF_STOCK;
    }
    if (quantity <= minQuantity) {
      return InventoryStatus.LOW_STOCK;
    }
    return InventoryStatus.ACTIVE;
  }

  private async generateSku(): Promise<string> {
    const prefix = 'INV';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
