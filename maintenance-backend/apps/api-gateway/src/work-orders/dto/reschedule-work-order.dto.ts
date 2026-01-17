import { IsDateString, IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RescheduleWorkOrderDto {
  @ApiProperty({
    description: 'New scheduled date for the work order',
    example: '2024-01-15T10:00:00Z'
  })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({
    description: 'UUID of the technician to assign',
    example: 'uuid-of-assigned-user'
  })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'Reason for rescheduling',
    example: 'Technician availability changed'
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
