import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveCompanyDto {
  @ApiProperty({
    example: 'Company meets all requirements',
    description: 'Approval notes (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectCompanyDto {
  @ApiProperty({
    example: 'Invalid domain verification',
    description: 'Reason for rejection',
  })
  @IsString()
  reason: string;
}
