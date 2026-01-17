import { PartialType } from '@nestjs/swagger';
import { CreateCompanySubscriptionDto } from './create-company-subscription.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanySubscriptionDto extends PartialType(CreateCompanySubscriptionDto) {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
