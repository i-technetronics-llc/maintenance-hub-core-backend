import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({
    description: 'Company ID',
    example: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiProperty({
    description: 'Module name',
    example: 'inventory',
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    description: 'Setting key',
    example: 'low_stock_threshold',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Setting value',
    example: { threshold: 10, alertEnabled: true },
  })
  @IsObject()
  @IsOptional()
  value?: any;

  @ApiProperty({
    description: 'Setting description',
    example: 'Low stock threshold for inventory alerts',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the setting is enabled',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
