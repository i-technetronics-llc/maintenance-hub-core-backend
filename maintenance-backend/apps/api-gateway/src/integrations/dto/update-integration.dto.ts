import { PartialType } from '@nestjs/mapped-types';
import { CreateIntegrationDto } from './create-integration.dto';
import { IsOptional, IsObject, IsBoolean } from 'class-validator';

export class UpdateIntegrationDto extends PartialType(CreateIntegrationDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMappingsDto {
  @IsObject()
  mappings: Record<string, Record<string, string>>;
}
