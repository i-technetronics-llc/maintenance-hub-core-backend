import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceBook, PriceBookItem } from '@app/database/entities/price-book.entity';

@Injectable()
export class PriceBooksService {
  constructor(
    @InjectRepository(PriceBook)
    private priceBookRepository: Repository<PriceBook>,
    @InjectRepository(PriceBookItem)
    private priceBookItemRepository: Repository<PriceBookItem>,
  ) {}

  // Price Book CRUD
  async findAll(organizationId?: string): Promise<PriceBook[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.priceBookRepository.find({
      where,
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PriceBook> {
    const priceBook = await this.priceBookRepository.findOne({
      where: { id },
      relations: ['organization', 'items'],
    });
    if (!priceBook) {
      throw new NotFoundException(`Price book with ID ${id} not found`);
    }
    return priceBook;
  }

  async findByOrganization(organizationId: string): Promise<PriceBook[]> {
    return this.priceBookRepository.find({
      where: { organizationId },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<PriceBook>): Promise<PriceBook> {
    const priceBook = this.priceBookRepository.create(data);
    return this.priceBookRepository.save(priceBook);
  }

  async update(id: string, data: Partial<PriceBook>): Promise<PriceBook> {
    const priceBook = await this.findOne(id);
    Object.assign(priceBook, data);
    return this.priceBookRepository.save(priceBook);
  }

  async remove(id: string): Promise<void> {
    const priceBook = await this.findOne(id);
    await this.priceBookRepository.remove(priceBook);
  }

  // Price Book Items CRUD
  async findAllItems(priceBookId: string): Promise<PriceBookItem[]> {
    // Verify price book exists
    await this.findOne(priceBookId);

    return this.priceBookItemRepository.find({
      where: { priceBookId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneItem(priceBookId: string, itemId: string): Promise<PriceBookItem> {
    const item = await this.priceBookItemRepository.findOne({
      where: { id: itemId, priceBookId },
    });
    if (!item) {
      throw new NotFoundException(`Price book item with ID ${itemId} not found`);
    }
    return item;
  }

  async createItem(priceBookId: string, data: Partial<PriceBookItem>): Promise<PriceBookItem> {
    // Verify price book exists
    await this.findOne(priceBookId);

    const item = this.priceBookItemRepository.create({
      ...data,
      priceBookId,
    });
    return this.priceBookItemRepository.save(item);
  }

  async updateItem(priceBookId: string, itemId: string, data: Partial<PriceBookItem>): Promise<PriceBookItem> {
    const item = await this.findOneItem(priceBookId, itemId);
    Object.assign(item, data);
    return this.priceBookItemRepository.save(item);
  }

  async removeItem(priceBookId: string, itemId: string): Promise<void> {
    const item = await this.findOneItem(priceBookId, itemId);
    await this.priceBookItemRepository.remove(item);
  }
}
