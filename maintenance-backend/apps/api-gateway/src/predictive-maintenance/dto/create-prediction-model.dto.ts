import { IsString, IsEnum, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PredictionModelType } from '@app/database/entities/prediction-model.entity';

export class CreatePredictionModelDto {
  @ApiProperty({ description: 'Model name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Model description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Asset type this model applies to' })
  @IsString()
  assetType: string;

  @ApiProperty({ enum: PredictionModelType, description: 'Type of prediction model' })
  @IsEnum(PredictionModelType)
  modelType: PredictionModelType;

  @ApiPropertyOptional({ description: 'Model parameters' })
  @IsOptional()
  @IsObject()
  parameters?: {
    zScoreThreshold?: number;
    iqrMultiplier?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
    shape?: number;
    scale?: number;
    windowSize?: number;
    minDataPoints?: number;
    trainingIterations?: number;
    [key: string]: any;
  };
}

export class UpdatePredictionModelDto {
  @ApiPropertyOptional({ description: 'Model name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Model description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Model parameters' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Model accuracy' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy?: number;
}

export class TrainModelDto {
  @ApiPropertyOptional({ description: 'Days of historical data to use' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  historicalDays?: number;

  @ApiPropertyOptional({ description: 'Force retrain even if recently trained' })
  @IsOptional()
  forceRetrain?: boolean;
}
