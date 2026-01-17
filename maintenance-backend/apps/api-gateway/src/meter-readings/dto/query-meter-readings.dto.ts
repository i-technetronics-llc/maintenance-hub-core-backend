import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MeterType } from '@app/database/entities/meter-reading.entity';

export class QueryMeterReadingsDto {
  @ApiPropertyOptional({ enum: MeterType, description: 'Filter by meter type' })
  @IsOptional()
  @IsEnum(MeterType)
  meterType?: MeterType;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limit results', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}
