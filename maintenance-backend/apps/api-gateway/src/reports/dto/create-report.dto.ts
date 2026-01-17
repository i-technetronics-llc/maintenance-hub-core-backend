import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportScheduleFrequency } from '@app/database/entities/saved-report.entity';

export class FilterDto {
  @ApiProperty({ description: 'Field name to filter on' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Filter operator', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in', 'between'] })
  @IsString()
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';

  @ApiProperty({ description: 'Filter value' })
  value: any;
}

export class SortingDto {
  @ApiProperty({ description: 'Field name to sort by' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc';
}

export class AggregationDto {
  @ApiProperty({ description: 'Field name to aggregate' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Aggregation function', enum: ['count', 'sum', 'avg', 'min', 'max'] })
  @IsEnum(['count', 'sum', 'avg', 'min', 'max'])
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export class ReportConfigurationDto {
  @ApiProperty({ description: 'Columns to include in the report', type: [String] })
  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @ApiPropertyOptional({ description: 'Filters to apply', type: [FilterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  filters?: FilterDto[];

  @ApiPropertyOptional({ description: 'Sorting configuration', type: [SortingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortingDto)
  sorting?: SortingDto[];

  @ApiPropertyOptional({ description: 'Group by fields', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @ApiPropertyOptional({ description: 'Aggregations to apply', type: [AggregationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AggregationDto)
  aggregations?: AggregationDto[];

  @ApiPropertyOptional({ description: 'Chart type for visualization' })
  @IsOptional()
  @IsString()
  chartType?: 'bar' | 'line' | 'pie' | 'table';

  @ApiPropertyOptional({ description: 'Date range filter' })
  @IsOptional()
  @IsObject()
  dateRange?: {
    start: string;
    end: string;
  };
}

export class CreateReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Report description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Data source for the report', enum: ['work_orders', 'assets', 'inventory', 'pm_schedules', 'users'] })
  @IsString()
  dataSource: 'work_orders' | 'assets' | 'inventory' | 'pm_schedules' | 'users';

  @ApiProperty({ description: 'Report configuration', type: ReportConfigurationDto })
  @ValidateNested()
  @Type(() => ReportConfigurationDto)
  configuration: ReportConfigurationDto;

  @ApiPropertyOptional({ description: 'Whether the report is public within the company' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Whether the report is scheduled' })
  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;

  @ApiPropertyOptional({ description: 'Schedule frequency', enum: ReportScheduleFrequency })
  @IsOptional()
  @IsEnum(ReportScheduleFrequency)
  scheduleFrequency?: ReportScheduleFrequency;

  @ApiPropertyOptional({ description: 'Email addresses to send scheduled reports to', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scheduleRecipients?: string[];

  @ApiPropertyOptional({ description: 'Time to run scheduled report (HH:mm format)' })
  @IsOptional()
  @IsString()
  scheduleTime?: string;

  @ApiPropertyOptional({ description: 'Day of week for weekly schedules (0-6)' })
  @IsOptional()
  scheduleDayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Day of month for monthly schedules (1-31)' })
  @IsOptional()
  scheduleDayOfMonth?: number;
}
