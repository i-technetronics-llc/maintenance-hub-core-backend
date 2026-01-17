import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMfaDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit TOTP code from authenticator app',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Token must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Token must contain only digits' })
  token: string;
}
