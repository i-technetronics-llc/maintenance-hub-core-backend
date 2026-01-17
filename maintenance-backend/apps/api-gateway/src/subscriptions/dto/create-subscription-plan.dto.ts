import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, SubscriptionPlanStatus } from '@app/common/enums';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Name of the subscription plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the subscription plan' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Price of the subscription plan' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ enum: SubscriptionPlanStatus, default: SubscriptionPlanStatus.ACTIVE })
  @IsEnum(SubscriptionPlanStatus)
  @IsOptional()
  status?: SubscriptionPlanStatus;

  @ApiPropertyOptional({ description: 'Maximum number of users', default: 5 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUsers?: number;

  @ApiPropertyOptional({ description: 'Maximum number of assets', default: 100 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxAssets?: number;

  @ApiPropertyOptional({ description: 'Maximum number of work orders', default: 500 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxWorkOrders?: number;

  @ApiPropertyOptional({ description: 'Maximum number of inventory items', default: 1000 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxInventoryItems?: number;

  @ApiPropertyOptional({ description: 'Storage limit in GB', default: 5 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  storageLimit?: number;

  @ApiPropertyOptional({ description: 'Feature flags for the plan' })
  @IsObject()
  @IsOptional()
  features?: {
    apiAccess?: boolean;
    advancedReporting?: boolean;
    customBranding?: boolean;
    prioritySupport?: boolean;
    multiLocation?: boolean;
    integrations?: boolean;
    auditLogs?: boolean;
    customRoles?: boolean;
    [key: string]: boolean | undefined;
  };

  @ApiPropertyOptional({ description: 'Whether this is the default plan', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Whether this is a trial plan', default: false })
  @IsBoolean()
  @IsOptional()
  isTrial?: boolean;

  @ApiPropertyOptional({ description: 'Number of trial days', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiPropertyOptional({ description: 'Sort order for display', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
