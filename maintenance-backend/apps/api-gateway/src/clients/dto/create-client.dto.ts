import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientStatus, ClientType } from '@app/database/entities/client.entity';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'CLI-001' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ enum: ClientType, default: ClientType.BUSINESS })
  @IsEnum(ClientType)
  @IsOptional()
  type?: ClientType;

  @ApiPropertyOptional({ enum: ClientStatus, default: ClientStatus.ACTIVE })
  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;

  @ApiPropertyOptional({ example: 'info@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'john.doe@acme.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1-555-987-6543' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Important client, handle with care' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}
