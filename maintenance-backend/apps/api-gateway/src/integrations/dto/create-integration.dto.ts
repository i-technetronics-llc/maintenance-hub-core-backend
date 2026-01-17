import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IntegrationType } from '@app/database/entities/integration-config.entity';

export class SyncSettingsDto {
  @IsOptional()
  @IsBoolean()
  syncAssets?: boolean;

  @IsOptional()
  @IsBoolean()
  syncInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  syncWorkOrders?: boolean;

  @IsOptional()
  @IsBoolean()
  syncPurchaseOrders?: boolean;

  @IsOptional()
  syncInterval?: number;

  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;
}

export class CreateIntegrationDto {
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  connectionConfig: Record<string, any>;

  @IsOptional()
  @IsObject()
  mappings?: Record<string, Record<string, string>>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SyncSettingsDto)
  syncSettings?: SyncSettingsDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
