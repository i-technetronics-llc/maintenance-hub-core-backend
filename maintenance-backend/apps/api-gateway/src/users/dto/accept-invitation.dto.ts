import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Invitation token from email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password to set for the account (minimum 12 characters)',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  password: string;
}
