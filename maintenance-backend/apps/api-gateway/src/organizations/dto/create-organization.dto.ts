import { IsNotEmpty, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType } from '@app/common/enums';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'ACME Corporation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: OrganizationType, example: OrganizationType.VENDOR })
  @IsEnum(OrganizationType)
  type: OrganizationType;

  @ApiProperty({ example: '123 Main St, City, State' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: { email: 'contact@acme.com', phone: '+1234567890' } })
  @IsObject()
  @IsOptional()
  contactInfo?: Record<string, any>;

  @ApiProperty({ example: { timezone: 'UTC', currency: 'USD' } })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
