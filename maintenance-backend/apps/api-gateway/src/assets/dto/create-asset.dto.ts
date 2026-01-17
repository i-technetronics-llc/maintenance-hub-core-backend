import { IsNotEmpty, IsString, IsUUID, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssetStatus } from '@app/common/enums';

export class CreateAssetDto {
  @ApiProperty({ example: 'HVAC Unit 101' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'AST-001' })
  @IsString()
  @IsOptional()
  assetCode?: string;

  @ApiProperty({ example: 'HVAC' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Carrier' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ example: 'Model-XYZ-2024' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'SN123456789' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ enum: AssetStatus, example: AssetStatus.ACTIVE })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ example: { capacity: '5 tons', refrigerant: 'R-410A' } })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;
}
