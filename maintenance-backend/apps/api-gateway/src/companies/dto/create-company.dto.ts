import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsUrl,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType, CompanyStatus, EmailValidationMode } from '@app/common/enums';

export class CreateCompanyDto {
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

  @ApiProperty({
    example: 'active',
    description: 'Company status (super-admin can set directly)',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE,
    required: false,
  })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @ApiProperty({
    example: 'strict',
    description: 'Email validation mode',
    enum: EmailValidationMode,
    default: EmailValidationMode.FLEXIBLE,
    required: false,
  })
  @IsEnum(EmailValidationMode)
  @IsOptional()
  emailValidationMode?: EmailValidationMode;

  @ApiProperty({
    example: false,
    description: 'Whether domain is verified',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDomainVerified?: boolean;

  @ApiProperty({
    example: 'acmecorp.com',
    description: 'Verified domain (if already verified)',
    required: false,
  })
  @IsString()
  @IsOptional()
  verifiedDomain?: string;
}
