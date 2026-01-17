import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderPriority } from '@app/common/enums';
import { PMTriggerType, PMFrequencyType } from '@app/database/entities/pm-schedule.entity';

class ChecklistItemDto {
  @ApiProperty()
  @IsString()
  item: string;

  @ApiProperty()
  @IsBoolean()
  mandatory: boolean;

  @ApiProperty()
  @IsNumber()
  order: number;
}

class ConditionRuleDto {
  @ApiProperty()
  @IsString()
  sensorType: string;

  @ApiProperty({ enum: ['gt', 'lt', 'eq', 'gte', 'lte'] })
  @IsEnum(['gt', 'lt', 'eq', 'gte', 'lte'])
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';

  @ApiProperty()
  @IsNumber()
  threshold: number;

  @ApiProperty()
  @IsString()
  unit: string;
}

export class CreatePMScheduleDto {
  @ApiProperty({ description: 'Name of the PM schedule' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the PM schedule' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Asset ID for this PM schedule' })
  @IsUUID()
  assetId: string;

  @ApiProperty({ enum: PMTriggerType, description: 'Type of trigger for this PM' })
  @IsEnum(PMTriggerType)
  triggerType: PMTriggerType;

  // Time-based fields
  @ApiPropertyOptional({ enum: PMFrequencyType })
  @IsOptional()
  @IsEnum(PMFrequencyType)
  frequencyType?: PMFrequencyType;

  @ApiPropertyOptional({ description: 'Frequency value (e.g., every 2 weeks)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  frequencyValue?: number;

  @ApiPropertyOptional({ description: 'Custom days interval for CUSTOM frequency' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  customDaysInterval?: number;

  @ApiPropertyOptional({ description: 'Start date for the schedule' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // Meter-based fields
  @ApiPropertyOptional({ description: 'Type of meter (runtime_hours, cycles, etc.)' })
  @IsOptional()
  @IsString()
  meterType?: string;

  @ApiPropertyOptional({ description: 'Interval between maintenance based on meter reading' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  meterInterval?: number;

  @ApiPropertyOptional({ description: 'Last meter reading' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lastMeterReading?: number;

  // Condition-based fields
  @ApiPropertyOptional({ type: [ConditionRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionRuleDto)
  conditionRules?: ConditionRuleDto[];

  // Work order settings
  @ApiPropertyOptional({ description: 'Task template ID for generated work orders' })
  @IsOptional()
  @IsUUID()
  taskTemplateId?: string;

  @ApiPropertyOptional({ enum: WorkOrderPriority })
  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @ApiPropertyOptional({ description: 'Estimated hours for maintenance' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  estimatedHours?: number;

  @ApiPropertyOptional({ type: [ChecklistItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional({ description: 'User ID to assign generated work orders to' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Days before due date to generate WO' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadDays?: number;

  @ApiPropertyOptional({ description: 'Days after which to mark as overdue' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  overdueDaysThreshold?: number;

  // Nested PM support
  @ApiPropertyOptional({ description: 'Parent PM schedule ID' })
  @IsOptional()
  @IsUUID()
  parentPmId?: string;

  @ApiPropertyOptional({ description: 'PM IDs triggered when this one completes' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  triggersPmIds?: string[];

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Whether the schedule is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
