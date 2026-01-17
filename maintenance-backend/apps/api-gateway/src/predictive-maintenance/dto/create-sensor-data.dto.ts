import { IsString, IsNumber, IsEnum, IsOptional, IsDate, IsBoolean, IsObject, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SensorType } from '@app/database/entities/sensor-data.entity';

export class CreateSensorDataDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsUUID()
  assetId: string;

  @ApiProperty({ enum: SensorType, description: 'Type of sensor' })
  @IsEnum(SensorType)
  sensorType: SensorType;

  @ApiPropertyOptional({ description: 'Physical sensor identifier' })
  @IsOptional()
  @IsString()
  sensorId?: string;

  @ApiPropertyOptional({ description: 'Human readable sensor name' })
  @IsOptional()
  @IsString()
  sensorName?: string;

  @ApiProperty({ description: 'Sensor reading value' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Timestamp of the reading' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  timestamp?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Minimum expected value' })
  @IsOptional()
  @IsNumber()
  minExpected?: number;

  @ApiPropertyOptional({ description: 'Maximum expected value' })
  @IsOptional()
  @IsNumber()
  maxExpected?: number;
}

export class BulkSensorDataDto {
  @ApiProperty({ type: [CreateSensorDataDto], description: 'Array of sensor readings' })
  readings: CreateSensorDataDto[];
}
