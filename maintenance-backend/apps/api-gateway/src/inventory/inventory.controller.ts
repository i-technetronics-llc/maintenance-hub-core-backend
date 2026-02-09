import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dto';
import { JwtAuthGuard } from '@app/common/guards';
import { Permissions } from '@app/common/decorators';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:create')
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  @ApiResponse({ status: 409, description: 'Inventory with this SKU already exists' })
  async create(@Body() createInventoryDto: CreateInventoryDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const inventory = await this.inventoryService.create(createInventoryDto, userId);
    return {
      success: true,
      message: 'Inventory item created successfully',
      data: inventory,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:view')
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.inventoryService.findAll({
      search,
      category,
      status,
      companyId,
      organizationId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('low-stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:view')
  @ApiOperation({ summary: 'Get inventory items with low stock' })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved successfully' })
  async getLowStockItems() {
    const items = await this.inventoryService.getLowStockItems();
    return {
      success: true,
      data: items,
    };
  }

  @Post('check-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:view')
  @ApiOperation({ summary: 'Check availability of inventory items' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  async checkAvailability(@Body() body: { itemIds: string[] }) {
    const availability = await this.inventoryService.checkAvailability(body.itemIds);
    return {
      success: true,
      data: availability,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:view')
  @ApiOperation({ summary: 'Get an inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async findOne(@Param('id') id: string) {
    const inventory = await this.inventoryService.findOne(id);
    return {
      success: true,
      data: inventory,
    };
  }

  @Get('sku/:sku')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:view')
  @ApiOperation({ summary: 'Get an inventory item by SKU' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async findBySku(@Param('sku') sku: string) {
    const inventory = await this.inventoryService.findBySku(sku);
    return {
      success: true,
      data: inventory,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:edit')
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const inventory = await this.inventoryService.update(id, updateInventoryDto, userId);
    return {
      success: true,
      message: 'Inventory item updated successfully',
      data: inventory,
    };
  }

  @Patch(':id/adjust')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  @ApiResponse({ status: 200, description: 'Inventory quantity adjusted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async adjustQuantity(
    @Param('id') id: string,
    @Body() body: { adjustment: number },
  ) {
    const inventory = await this.inventoryService.adjustQuantity(id, body.adjustment);
    return {
      success: true,
      message: 'Inventory quantity adjusted successfully',
      data: inventory,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Permissions('inventory:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiResponse({ status: 204, description: 'Inventory item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    await this.inventoryService.remove(id, userId);
  }
}
