import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkOrderStatus, WorkOrderPriority, WorkOrderRiskLevel, WorkOrderUrgency, WorkOrderType } from '@app/common/enums';

class ChecklistItemDto {
  @ApiProperty({ example: 'Check oil level' })
  @IsString()
  @IsNotEmpty()
  item: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  mandatory?: boolean;
}

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'HVAC Maintenance - Unit 101' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Annual maintenance checkup for HVAC unit' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-asset' })
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-assigned-user' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-client-organization' })
  @IsUUID()
  @IsOptional()
  clientOrgId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-vendor-organization' })
  @IsUUID()
  @IsOptional()
  vendorOrgId?: string;

  @ApiPropertyOptional({ enum: WorkOrderType, example: WorkOrderType.CORRECTIVE })
  @IsEnum(WorkOrderType)
  @IsOptional()
  type?: WorkOrderType;

  @ApiPropertyOptional({ enum: WorkOrderPriority, example: WorkOrderPriority.MEDIUM })
  @IsEnum(WorkOrderPriority)
  @IsOptional()
  priority?: WorkOrderPriority;

  @ApiPropertyOptional({ enum: WorkOrderStatus, example: WorkOrderStatus.DRAFT })
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @ApiPropertyOptional({ enum: WorkOrderRiskLevel, example: WorkOrderRiskLevel.LOW })
  @IsEnum(WorkOrderRiskLevel)
  @IsOptional()
  riskLevel?: WorkOrderRiskLevel;

  @ApiPropertyOptional({ enum: WorkOrderUrgency, example: WorkOrderUrgency.NORMAL })
  @IsEnum(WorkOrderUrgency)
  @IsOptional()
  urgency?: WorkOrderUrgency;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: Date;

  @ApiPropertyOptional({ example: '2024-01-20T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ example: 1000.00 })
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({ type: [ChecklistItemDto], example: [{ item: 'Check oil level', completed: false, mandatory: true }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  checklist?: ChecklistItemDto[];
}
