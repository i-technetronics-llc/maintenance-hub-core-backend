import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@vendor1.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Admin@123',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit TOTP code from authenticator app (required if MFA is enabled)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'MFA token must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'MFA token must contain only digits' })
  mfaToken?: string;
}
