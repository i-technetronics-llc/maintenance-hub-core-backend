import { IsString, IsOptional, IsUUID, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@app/common/enums';

export class CreateCompanySubscriptionDto {
  @ApiProperty({ description: 'Company ID' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Subscription Plan ID' })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Start date of the subscription' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date of the subscription' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Current price (override plan price)' })
  @IsNumber()
  @IsOptional()
  currentPrice?: number;
}
