import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SLAStatus, SLACategory, SLAMetricUnit } from '@app/database/entities/sla.entity';

class SLASubItemDto {
  @ApiProperty({ example: 'Daily cleaning' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Daily cleaning of all common areas' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 95 })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({ enum: SLAMetricUnit })
  @IsEnum(SLAMetricUnit)
  @IsOptional()
  metricUnit?: SLAMetricUnit;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRequired: boolean;
}

class PriorityResponseTimesDto {
  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @IsOptional()
  critical?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @IsOptional()
  high?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsNumber()
  @IsOptional()
  medium?: number;

  @ApiPropertyOptional({ example: 48 })
  @IsNumber()
  @IsOptional()
  low?: number;
}

class WorkingHoursDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5] })
  @IsArray()
  workingDays: number[];

  @ApiProperty({ example: true })
  @IsBoolean()
  excludeHolidays: boolean;
}

export class CreateSLADto {
  @ApiProperty({ example: 'Power Availability SLA' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'SLA-001' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Ensures 99.9% power availability' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: SLACategory, default: SLACategory.OTHER })
  @IsEnum(SLACategory)
  @IsOptional()
  category?: SLACategory;

  @ApiPropertyOptional({ enum: SLAStatus, default: SLAStatus.ACTIVE })
  @IsEnum(SLAStatus)
  @IsOptional()
  status?: SLAStatus;

  @ApiPropertyOptional({ example: 99.9 })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({ enum: SLAMetricUnit, default: SLAMetricUnit.PERCENTAGE })
  @IsEnum(SLAMetricUnit)
  @IsOptional()
  metricUnit?: SLAMetricUnit;

  @ApiPropertyOptional({ example: 95 })
  @IsNumber()
  @IsOptional()
  warningThreshold?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsNumber()
  @IsOptional()
  criticalThreshold?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  penaltyPercentage?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  escalationDays?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @IsOptional()
  responseTimeHours?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsNumber()
  @IsOptional()
  resolutionTimeHours?: number;

  @ApiPropertyOptional({ type: [SLASubItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SLASubItemDto)
  @IsOptional()
  subItems?: SLASubItemDto[];

  @ApiPropertyOptional({ type: PriorityResponseTimesDto })
  @ValidateNested()
  @Type(() => PriorityResponseTimesDto)
  @IsOptional()
  priorityResponseTimes?: PriorityResponseTimesDto;

  @ApiPropertyOptional({ type: WorkingHoursDto })
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  @IsOptional()
  workingHours?: WorkingHoursDto;

  @ApiPropertyOptional({ example: 'uuid-of-client' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}
