import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateVerificationDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Company ID to initiate domain verification for',
  })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
