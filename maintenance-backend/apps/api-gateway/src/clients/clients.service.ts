import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '@app/database/entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Generate code if not provided
    if (!createClientDto.code) {
      const count = await this.clientsRepository.count();
      createClientDto.code = `CLI-${String(count + 1).padStart(4, '0')}`;
    }

    const client = this.clientsRepository.create(createClientDto);
    return this.clientsRepository.save(client);
  }

  async findAll(organizationId?: string): Promise<Client[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.clientsRepository.find({
      where,
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, updateClientDto);
    return this.clientsRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepository.remove(client);
  }

  async count(organizationId?: string): Promise<number> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.clientsRepository.count({ where });
  }
}
