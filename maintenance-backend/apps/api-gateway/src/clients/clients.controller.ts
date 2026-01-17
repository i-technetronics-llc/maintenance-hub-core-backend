import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '@app/common/guards';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiQuery({ name: 'organizationId', required: false })
  findAll(@Query('organizationId') organizationId?: string) {
    return this.clientsService.findAll(organizationId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total count of clients' })
  @ApiQuery({ name: 'organizationId', required: false })
  count(@Query('organizationId') organizationId?: string) {
    return this.clientsService.count(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
