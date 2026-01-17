import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InventoryStatus, InventoryCategory } from '@app/common/enums';

export class CreateInventoryDto {
  @ApiProperty({
    description: 'Stock Keeping Unit (unique identifier)',
    example: 'SKU-001',
    required: false,
  })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({
    description: 'Inventory item name',
    example: 'Motor Bearing 6205',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Item description',
    example: 'Deep groove ball bearing for electric motors',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Inventory category',
    example: InventoryCategory.SPARE_PARTS,
    enum: InventoryCategory,
  })
  @IsEnum(InventoryCategory)
  @IsOptional()
  category?: InventoryCategory;

  @ApiProperty({
    description: 'Current quantity in stock',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Minimum quantity threshold for low stock alerts',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minQuantity?: number;

  @ApiProperty({
    description: 'Maximum quantity for storage',
    example: 200,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxQuantity?: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'pieces',
    required: false,
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    description: 'Price per unit',
    example: 25.99,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({
    description: 'Storage location',
    example: 'Warehouse A, Shelf B3',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Supplier name',
    example: 'ABC Supplies Inc.',
    required: false,
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiProperty({
    description: 'Manufacturer name',
    example: 'SKF',
    required: false,
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({
    description: 'Part number',
    example: '6205-2RS',
    required: false,
  })
  @IsString()
  @IsOptional()
  partNumber?: string;

  @ApiProperty({
    description: 'Inventory status',
    example: InventoryStatus.ACTIVE,
    enum: InventoryStatus,
    required: false,
  })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;

  @ApiProperty({
    description: 'Organization ID',
    example: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    description: 'Additional specifications',
    example: { weight: '0.5kg', dimensions: '52x15mm' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiProperty({
    description: 'Last restock date',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  lastRestockDate?: string;

  @ApiProperty({
    description: 'Expiry date',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Keep in dry storage',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
