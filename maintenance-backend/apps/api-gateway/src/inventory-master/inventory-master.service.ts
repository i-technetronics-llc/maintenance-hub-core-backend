import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  InventoryLocation,
  Manufacturer,
  Supplier,
  InventoryCategory,
} from '@app/database';
import {
  CreateLocationDto,
  UpdateLocationDto,
  CreateManufacturerDto,
  UpdateManufacturerDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';

@Injectable()
export class InventoryMasterService {
  constructor(
    @InjectRepository(InventoryLocation)
    private locationRepository: Repository<InventoryLocation>,
    @InjectRepository(Manufacturer)
    private manufacturerRepository: Repository<Manufacturer>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(InventoryCategory)
    private categoryRepository: Repository<InventoryCategory>,
  ) {}

  // ==================== LOCATIONS ====================
  async createLocation(dto: CreateLocationDto): Promise<InventoryLocation> {
    const existing = await this.locationRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Location with code ${dto.code} already exists`);
    }
    const location = this.locationRepository.create(dto);
    return this.locationRepository.save(location);
  }

  async findAllLocations(options?: { search?: string; isActive?: boolean }): Promise<InventoryLocation[]> {
    const query = this.locationRepository.createQueryBuilder('location');
    if (options?.search) {
      query.where('(location.name ILIKE :search OR location.code ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }
    if (options?.isActive !== undefined) {
      query.andWhere('location.isActive = :isActive', { isActive: options.isActive });
    }
    query.orderBy('location.name', 'ASC');
    return query.getMany();
  }

  async findLocationById(id: string): Promise<InventoryLocation> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<InventoryLocation> {
    const location = await this.findLocationById(id);
    if (dto.code && dto.code !== location.code) {
      const existing = await this.locationRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Location with code ${dto.code} already exists`);
      }
    }
    Object.assign(location, dto);
    return this.locationRepository.save(location);
  }

  async deleteLocation(id: string): Promise<void> {
    const location = await this.findLocationById(id);
    await this.locationRepository.remove(location);
  }

  // ==================== MANUFACTURERS ====================
  async createManufacturer(dto: CreateManufacturerDto): Promise<Manufacturer> {
    const existing = await this.manufacturerRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Manufacturer with code ${dto.code} already exists`);
    }
    const manufacturer = this.manufacturerRepository.create(dto);
    return this.manufacturerRepository.save(manufacturer);
  }

  async findAllManufacturers(options?: { search?: string; isActive?: boolean }): Promise<Manufacturer[]> {
    const query = this.manufacturerRepository.createQueryBuilder('manufacturer');
    if (options?.search) {
      query.where('(manufacturer.name ILIKE :search OR manufacturer.code ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }
    if (options?.isActive !== undefined) {
      query.andWhere('manufacturer.isActive = :isActive', { isActive: options.isActive });
    }
    query.orderBy('manufacturer.name', 'ASC');
    return query.getMany();
  }

  async findManufacturerById(id: string): Promise<Manufacturer> {
    const manufacturer = await this.manufacturerRepository.findOne({ where: { id } });
    if (!manufacturer) {
      throw new NotFoundException(`Manufacturer with ID ${id} not found`);
    }
    return manufacturer;
  }

  async updateManufacturer(id: string, dto: UpdateManufacturerDto): Promise<Manufacturer> {
    const manufacturer = await this.findManufacturerById(id);
    if (dto.code && dto.code !== manufacturer.code) {
      const existing = await this.manufacturerRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Manufacturer with code ${dto.code} already exists`);
      }
    }
    Object.assign(manufacturer, dto);
    return this.manufacturerRepository.save(manufacturer);
  }

  async deleteManufacturer(id: string): Promise<void> {
    const manufacturer = await this.findManufacturerById(id);
    await this.manufacturerRepository.remove(manufacturer);
  }

  // ==================== SUPPLIERS ====================
  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    const existing = await this.supplierRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Supplier with code ${dto.code} already exists`);
    }
    const supplier = this.supplierRepository.create(dto);
    return this.supplierRepository.save(supplier);
  }

  async findAllSuppliers(options?: { search?: string; isActive?: boolean; isPreferred?: boolean }): Promise<Supplier[]> {
    const query = this.supplierRepository.createQueryBuilder('supplier');
    if (options?.search) {
      query.where('(supplier.name ILIKE :search OR supplier.code ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }
    if (options?.isActive !== undefined) {
      query.andWhere('supplier.isActive = :isActive', { isActive: options.isActive });
    }
    if (options?.isPreferred !== undefined) {
      query.andWhere('supplier.isPreferred = :isPreferred', { isPreferred: options.isPreferred });
    }
    query.orderBy('supplier.name', 'ASC');
    return query.getMany();
  }

  async findSupplierById(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findSupplierById(id);
    if (dto.code && dto.code !== supplier.code) {
      const existing = await this.supplierRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Supplier with code ${dto.code} already exists`);
      }
    }
    Object.assign(supplier, dto);
    return this.supplierRepository.save(supplier);
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = await this.findSupplierById(id);
    await this.supplierRepository.remove(supplier);
  }

  // ==================== CATEGORIES ====================
  async createCategory(dto: CreateCategoryDto): Promise<InventoryCategory> {
    const existing = await this.categoryRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Category with code ${dto.code} already exists`);
    }
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAllCategories(options?: { search?: string; isActive?: boolean }): Promise<InventoryCategory[]> {
    const query = this.categoryRepository.createQueryBuilder('category');
    if (options?.search) {
      query.where('(category.name ILIKE :search OR category.code ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }
    if (options?.isActive !== undefined) {
      query.andWhere('category.isActive = :isActive', { isActive: options.isActive });
    }
    query.orderBy('category.sortOrder', 'ASC').addOrderBy('category.name', 'ASC');
    return query.getMany();
  }

  async findCategoryById(id: string): Promise<InventoryCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<InventoryCategory> {
    const category = await this.findCategoryById(id);
    if (dto.code && dto.code !== category.code) {
      const existing = await this.categoryRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Category with code ${dto.code} already exists`);
      }
    }
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.findCategoryById(id);
    await this.categoryRepository.remove(category);
  }
}
