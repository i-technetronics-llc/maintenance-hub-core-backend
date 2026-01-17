import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsUrl,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType } from '@app/common/enums';

export class CompanySignupDto {
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Company name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'VENDOR',
    description: 'Organization type code (e.g., VENDOR, CLIENT)',
  })
  @IsString()
  @IsNotEmpty()
  organizationTypeCode: string;

  @ApiProperty({
    example: 'https://acmecorp.com',
    description: 'Company website URL',
  })
  @IsUrl()
  @IsNotEmpty()
  website: string;

  @ApiProperty({
    example: 'contact@acmecorp.com',
    description: 'Company work email',
  })
  @IsEmail()
  @IsNotEmpty()
  workEmail: string;

  @ApiProperty({
    example: '+1-555-0123',
    description: 'Company phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: '123 Main Street',
    description: 'Company address',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'New York',
    description: 'City',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'NY',
    description: 'State',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    example: '10001',
    description: 'Postal code',
    required: false,
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({
    example: 'Manufacturing',
    description: 'Industry',
    required: false,
  })
  @IsString()
  @IsOptional()
  industry?: string;

  // Admin user details
  @ApiProperty({
    example: 'John',
    description: 'Admin first name',
  })
  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Admin last name',
  })
  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @ApiProperty({
    example: 'john.doe@acmecorp.com',
    description: 'Admin email (must match company domain)',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Admin password (minimum 12 characters)',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  adminPassword: string;

  @ApiProperty({
    example: '+1-555-0124',
    description: 'Admin phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  adminPhone?: string;
}
