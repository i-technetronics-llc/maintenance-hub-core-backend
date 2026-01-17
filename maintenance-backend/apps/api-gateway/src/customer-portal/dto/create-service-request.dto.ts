import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceRequestCategory, ServiceRequestPriority } from '@app/database/entities/service-request.entity';

export class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;
}

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ServiceRequestCategory)
  @IsOptional()
  category?: ServiceRequestCategory;

  @IsEnum(ServiceRequestPriority)
  @IsOptional()
  priority?: ServiceRequestPriority;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsUUID()
  @IsOptional()
  assetId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];
}
