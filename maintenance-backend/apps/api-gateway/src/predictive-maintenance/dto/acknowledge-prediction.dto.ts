import { IsString, IsOptional, IsEnum, IsBoolean, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PredictionStatus } from '@app/database/entities/asset-prediction.entity';

export class AcknowledgePredictionDto {
  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: PredictionStatus, description: 'New status' })
  @IsOptional()
  @IsEnum(PredictionStatus)
  status?: PredictionStatus;
}

export class ResolvePredictionDto {
  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Was the prediction accurate?' })
  @IsOptional()
  @IsBoolean()
  wasAccurate?: boolean;

  @ApiPropertyOptional({ description: 'Actual failure date (if occurred)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualFailureDate?: Date;
}

export class CreateWorkOrderFromPredictionDto {
  @ApiProperty({ description: 'Prediction ID' })
  @IsUUID()
  predictionId: string;

  @ApiPropertyOptional({ description: 'Work order title override' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Work order description override' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Assigned technician ID' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Scheduled date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledDate?: Date;
}
