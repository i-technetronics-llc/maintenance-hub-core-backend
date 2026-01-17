import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  CreateCompanySubscriptionDto,
  UpdateCompanySubscriptionDto,
} from './dto';
import { JwtAuthGuard } from '@app/common/guards';
import { SubscriptionStatus } from '@app/common/enums';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ================== Subscription Plans (Super Admin Only) ==================

  @Post('plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription plan (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    const plan = await this.subscriptionsService.createPlan(dto);
    return {
      success: true,
      message: 'Subscription plan created successfully',
      data: plan,
    };
  }

  @Get('plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAllPlans(@Query('includeInactive') includeInactive?: string) {
    const plans = await this.subscriptionsService.findAllPlans(includeInactive === 'true');
    return {
      success: true,
      data: plans,
    };
  }

  @Get('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async findPlanById(@Param('id') id: string) {
    const plan = await this.subscriptionsService.findPlanById(id);
    return {
      success: true,
      data: plan,
    };
  }

  @Patch('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subscription plan (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    const plan = await this.subscriptionsService.updatePlan(id, dto);
    return {
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan,
    };
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subscription plan (Super Admin only)' })
  @ApiResponse({ status: 204, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete plan with active subscriptions' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(@Param('id') id: string) {
    await this.subscriptionsService.deletePlan(id);
  }

  @Post('plans/seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed default subscription plans (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Default plans seeded successfully' })
  async seedDefaultPlans() {
    const plans = await this.subscriptionsService.seedDefaultPlans();
    return {
      success: true,
      message: plans.length > 0 ? 'Default plans seeded successfully' : 'Plans already exist',
      data: plans,
    };
  }

  // ================== Company Subscriptions ==================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a company subscription (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Company already has an active subscription' })
  async createSubscription(@Body() dto: CreateCompanySubscriptionDto) {
    const subscription = await this.subscriptionsService.createSubscription(dto);
    return {
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all company subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  async findAllSubscriptions(
    @Query('companyId') companyId?: string,
    @Query('status') status?: SubscriptionStatus,
  ) {
    const subscriptions = await this.subscriptionsService.findAllSubscriptions({
      companyId,
      status,
    });
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user company subscription' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async getMySubscription(@Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      return {
        success: true,
        data: null,
        message: 'User is not associated with a company',
      };
    }

    const subscription = await this.subscriptionsService.getActiveSubscriptionByCompanyId(companyId);
    const limits = subscription
      ? await this.subscriptionsService.checkLimits(companyId)
      : null;

    return {
      success: true,
      data: subscription
        ? {
            ...subscription,
            usage: limits?.usage,
            withinLimits: limits?.withinLimits,
          }
        : null,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findSubscriptionById(@Param('id') id: string) {
    const subscription = await this.subscriptionsService.findSubscriptionById(id);
    return {
      success: true,
      data: subscription,
    };
  }

  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription by company ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async findByCompanyId(@Param('companyId') companyId: string) {
    const subscription = await this.subscriptionsService.findSubscriptionByCompanyId(companyId);
    return {
      success: true,
      data: subscription,
    };
  }

  @Get('company/:companyId/limits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check subscription limits for a company' })
  @ApiResponse({ status: 200, description: 'Limits checked successfully' })
  async checkLimits(@Param('companyId') companyId: string) {
    const limits = await this.subscriptionsService.checkLimits(companyId);
    return {
      success: true,
      data: limits,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subscription (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateCompanySubscriptionDto,
  ) {
    const subscription = await this.subscriptionsService.updateSubscription(id, dto);
    return {
      success: true,
      message: 'Subscription updated successfully',
      data: subscription,
    };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const subscription = await this.subscriptionsService.cancelSubscription(id, reason);
    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    };
  }

  @Post(':id/change-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan changed successfully' })
  @ApiResponse({ status: 404, description: 'Subscription or plan not found' })
  async changePlan(
    @Param('id') id: string,
    @Body('planId') planId: string,
  ) {
    const subscription = await this.subscriptionsService.changePlan(id, planId);
    return {
      success: true,
      message: 'Subscription plan changed successfully',
      data: subscription,
    };
  }
}
