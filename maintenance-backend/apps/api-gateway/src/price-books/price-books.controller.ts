import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/common/guards';
import { PriceBooksService } from './price-books.service';

@ApiTags('Price Books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('price-books')
export class PriceBooksController {
  constructor(private readonly priceBooksService: PriceBooksService) {}

  // ========== Price Book Endpoints ==========

  @Post()
  @ApiOperation({ summary: 'Create a new price book' })
  create(@Body() createDto: any) {
    return this.priceBooksService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all price books' })
  @ApiQuery({ name: 'organizationId', required: false })
  findAll(@Query('organizationId') organizationId?: string) {
    return this.priceBooksService.findAll(organizationId);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get price books by organization' })
  findByOrganization(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.priceBooksService.findByOrganization(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a price book by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceBooksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a price book' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: any) {
    return this.priceBooksService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a price book' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceBooksService.remove(id);
  }

  // ========== Price Book Items Endpoints ==========

  @Get(':priceBookId/items')
  @ApiOperation({ summary: 'Get all items in a price book' })
  findAllItems(@Param('priceBookId', ParseUUIDPipe) priceBookId: string) {
    return this.priceBooksService.findAllItems(priceBookId);
  }

  @Post(':priceBookId/items')
  @ApiOperation({ summary: 'Add an item to a price book' })
  createItem(
    @Param('priceBookId', ParseUUIDPipe) priceBookId: string,
    @Body() createItemDto: any,
  ) {
    return this.priceBooksService.createItem(priceBookId, createItemDto);
  }

  @Patch(':priceBookId/items/:itemId')
  @ApiOperation({ summary: 'Update an item in a price book' })
  updateItem(
    @Param('priceBookId', ParseUUIDPipe) priceBookId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateItemDto: any,
  ) {
    return this.priceBooksService.updateItem(priceBookId, itemId, updateItemDto);
  }

  @Delete(':priceBookId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an item from a price book' })
  removeItem(
    @Param('priceBookId', ParseUUIDPipe) priceBookId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.priceBooksService.removeItem(priceBookId, itemId);
  }
}
