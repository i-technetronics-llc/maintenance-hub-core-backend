import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryMasterService } from './inventory-master.service';
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

@Controller('inventory-master')
export class InventoryMasterController {
  constructor(private readonly inventoryMasterService: InventoryMasterService) {}

  // ==================== LOCATIONS ====================
  @Post('locations')
  createLocation(@Body() dto: CreateLocationDto) {
    return this.inventoryMasterService.createLocation(dto);
  }

  @Get('locations')
  findAllLocations(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.inventoryMasterService.findAllLocations({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('locations/:id')
  findLocationById(@Param('id') id: string) {
    return this.inventoryMasterService.findLocationById(id);
  }

  @Put('locations/:id')
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.inventoryMasterService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLocation(@Param('id') id: string) {
    return this.inventoryMasterService.deleteLocation(id);
  }

  // ==================== MANUFACTURERS ====================
  @Post('manufacturers')
  createManufacturer(@Body() dto: CreateManufacturerDto) {
    return this.inventoryMasterService.createManufacturer(dto);
  }

  @Get('manufacturers')
  findAllManufacturers(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.inventoryMasterService.findAllManufacturers({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('manufacturers/:id')
  findManufacturerById(@Param('id') id: string) {
    return this.inventoryMasterService.findManufacturerById(id);
  }

  @Put('manufacturers/:id')
  updateManufacturer(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    return this.inventoryMasterService.updateManufacturer(id, dto);
  }

  @Delete('manufacturers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteManufacturer(@Param('id') id: string) {
    return this.inventoryMasterService.deleteManufacturer(id);
  }

  // ==================== SUPPLIERS ====================
  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.inventoryMasterService.createSupplier(dto);
  }

  @Get('suppliers')
  findAllSuppliers(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('isPreferred') isPreferred?: string,
  ) {
    return this.inventoryMasterService.findAllSuppliers({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isPreferred: isPreferred !== undefined ? isPreferred === 'true' : undefined,
    });
  }

  @Get('suppliers/:id')
  findSupplierById(@Param('id') id: string) {
    return this.inventoryMasterService.findSupplierById(id);
  }

  @Put('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.inventoryMasterService.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSupplier(@Param('id') id: string) {
    return this.inventoryMasterService.deleteSupplier(id);
  }

  // ==================== CATEGORIES ====================
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.inventoryMasterService.createCategory(dto);
  }

  @Get('categories')
  findAllCategories(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.inventoryMasterService.findAllCategories({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('categories/:id')
  findCategoryById(@Param('id') id: string) {
    return this.inventoryMasterService.findCategoryById(id);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.inventoryMasterService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@Param('id') id: string) {
    return this.inventoryMasterService.deleteCategory(id);
  }
}
