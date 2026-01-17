import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeterType } from '@app/database/entities/meter-reading.entity';

export class CreateMeterReadingDto {
  @ApiProperty({ description: 'Asset ID for this meter reading' })
  @IsUUID()
  assetId: string;

  @ApiProperty({ enum: MeterType, description: 'Type of meter reading' })
  @IsEnum(MeterType)
  meterType: MeterType;

  @ApiPropertyOptional({ description: 'Custom meter name (for CUSTOM type)' })
  @IsOptional()
  @IsString()
  customMeterName?: string;

  @ApiProperty({ description: 'Current meter reading value' })
  @IsNumber()
  @Min(0)
  readingValue: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'When the reading was recorded' })
  @IsDateString()
  recordedAt: string;

  @ApiPropertyOptional({ description: 'Notes about the reading' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Source of reading (manual, iot_sensor, import)',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
