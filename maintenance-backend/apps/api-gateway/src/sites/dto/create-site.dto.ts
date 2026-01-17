import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum, IsEmail, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SiteStatus, SiteType } from '@app/database/entities/site.entity';

export class CreateSiteDto {
  @ApiProperty({ example: 'Downtown Office Building' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'SITE-001' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ enum: SiteType, default: SiteType.COMMERCIAL })
  @IsEnum(SiteType)
  @IsOptional()
  type?: SiteType;

  @ApiPropertyOptional({ enum: SiteStatus, default: SiteStatus.ACTIVE })
  @IsEnum(SiteStatus)
  @IsOptional()
  status?: SiteStatus;

  @ApiPropertyOptional({ example: '456 Business Ave' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Los Angeles' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '90001' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 34.0522 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -118.2437 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'jane.smith@site.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1-555-456-7890' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Main headquarters building' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Access via main entrance only' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid-of-client' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-sla' })
  @IsUUID()
  @IsOptional()
  slaId?: string;

  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}
