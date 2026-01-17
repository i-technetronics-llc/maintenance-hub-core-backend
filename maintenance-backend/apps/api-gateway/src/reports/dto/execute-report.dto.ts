import { IsOptional, IsObject, IsNumber, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteReportDto {
  @ApiPropertyOptional({ description: 'Override filters for this execution' })
  @IsOptional()
  @IsObject()
  overrideFilters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Override date range for this execution' })
  @IsOptional()
  @IsObject()
  dateRange?: {
    start: string;
    end: string;
  };

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Export format', enum: ['json', 'csv'] })
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv';
}
