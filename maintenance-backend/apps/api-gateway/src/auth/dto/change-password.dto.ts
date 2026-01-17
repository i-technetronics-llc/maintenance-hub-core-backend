import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Current password',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password (minimum 12 characters)',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  newPassword: string;
}
