import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '@app/database/entities/subscription-plan.entity';
import { CompanySubscription } from '@app/database/entities/company-subscription.entity';
import { SubscriptionStatus, SubscriptionPlanStatus } from '@app/common/enums';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  CreateCompanySubscriptionDto,
  UpdateCompanySubscriptionDto,
} from './dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(CompanySubscription)
    private readonly subscriptionRepository: Repository<CompanySubscription>,
  ) {}

  // ================== Subscription Plans ==================

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    // If this is set as default, remove default from other plans
    if (dto.isDefault) {
      await this.planRepository.update({}, { isDefault: false });
    }

    const plan = this.planRepository.create(dto);
    return await this.planRepository.save(plan);
  }

  async findAllPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
    const where: any = {};
    if (!includeInactive) {
      where.status = SubscriptionPlanStatus.ACTIVE;
    }

    return await this.planRepository.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID "${id}" not found`);
    }
    return plan;
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findPlanById(id);

    // If this is set as default, remove default from other plans
    if (dto.isDefault && !plan.isDefault) {
      await this.planRepository.update({}, { isDefault: false });
    }

    Object.assign(plan, dto);
    return await this.planRepository.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.findPlanById(id);

    // Check if any companies are using this plan
    const subscriptionCount = await this.subscriptionRepository.count({
      where: { planId: id },
    });

    if (subscriptionCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${subscriptionCount} active subscription(s). Please migrate subscribers first.`,
      );
    }

    await this.planRepository.remove(plan);
  }

  async getDefaultPlan(): Promise<SubscriptionPlan | null> {
    return await this.planRepository.findOne({
      where: { isDefault: true, status: SubscriptionPlanStatus.ACTIVE },
    });
  }

  // ================== Company Subscriptions ==================

  async createSubscription(dto: CreateCompanySubscriptionDto): Promise<CompanySubscription> {
    // Check if company already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        companyId: dto.companyId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('Company already has an active subscription');
    }

    // Get the plan to set default values
    const plan = await this.findPlanById(dto.planId);

    const subscription = this.subscriptionRepository.create({
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      currentPrice: dto.currentPrice ?? plan.price,
      status: dto.status || (plan.isTrial ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE),
      trialEndsAt: plan.isTrial
        ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
        : null,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async findAllSubscriptions(params?: {
    companyId?: string;
    status?: SubscriptionStatus;
  }): Promise<CompanySubscription[]> {
    const where: any = {};

    if (params?.companyId) {
      where.companyId = params.companyId;
    }

    if (params?.status) {
      where.status = params.status;
    }

    return await this.subscriptionRepository.find({
      where,
      relations: ['company', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSubscriptionById(id: string): Promise<CompanySubscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['company', 'plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    return subscription;
  }

  async findSubscriptionByCompanyId(companyId: string): Promise<CompanySubscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { companyId },
      relations: ['company', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveSubscriptionByCompanyId(companyId: string): Promise<CompanySubscription | null> {
    return await this.subscriptionRepository.findOne({
      where: {
        companyId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['company', 'plan'],
    });
  }

  async updateSubscription(
    id: string,
    dto: UpdateCompanySubscriptionDto,
  ): Promise<CompanySubscription> {
    const subscription = await this.findSubscriptionById(id);

    if (dto.planId && dto.planId !== subscription.planId) {
      // Verify new plan exists
      await this.findPlanById(dto.planId);
    }

    Object.assign(subscription, dto);

    if (dto.endDate) {
      subscription.endDate = new Date(dto.endDate);
    }

    return await this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(id: string, reason?: string): Promise<CompanySubscription> {
    const subscription = await this.findSubscriptionById(id);

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || null;

    return await this.subscriptionRepository.save(subscription);
  }

  async changePlan(
    subscriptionId: string,
    newPlanId: string,
  ): Promise<CompanySubscription> {
    const subscription = await this.findSubscriptionById(subscriptionId);
    const newPlan = await this.findPlanById(newPlanId);

    subscription.planId = newPlanId;
    subscription.plan = newPlan;
    subscription.currentPrice = newPlan.price;

    return await this.subscriptionRepository.save(subscription);
  }

  async updateUsage(
    companyId: string,
    usage: {
      currentUsers?: number;
      currentAssets?: number;
      currentWorkOrders?: number;
      currentInventoryItems?: number;
      storageUsed?: number;
    },
  ): Promise<CompanySubscription | null> {
    const subscription = await this.getActiveSubscriptionByCompanyId(companyId);

    if (!subscription) {
      return null;
    }

    Object.assign(subscription, usage);
    return await this.subscriptionRepository.save(subscription);
  }

  async checkLimits(companyId: string): Promise<{
    withinLimits: boolean;
    usage: Record<string, { current: number; max: number; percentage: number }>;
  }> {
    const subscription = await this.getActiveSubscriptionByCompanyId(companyId);

    if (!subscription) {
      return {
        withinLimits: false,
        usage: {},
      };
    }

    const plan = subscription.plan;
    const usage = {
      users: {
        current: subscription.currentUsers,
        max: plan.maxUsers,
        percentage: Math.round((subscription.currentUsers / plan.maxUsers) * 100),
      },
      assets: {
        current: subscription.currentAssets,
        max: plan.maxAssets,
        percentage: Math.round((subscription.currentAssets / plan.maxAssets) * 100),
      },
      workOrders: {
        current: subscription.currentWorkOrders,
        max: plan.maxWorkOrders,
        percentage: Math.round((subscription.currentWorkOrders / plan.maxWorkOrders) * 100),
      },
      inventoryItems: {
        current: subscription.currentInventoryItems,
        max: plan.maxInventoryItems,
        percentage: Math.round((subscription.currentInventoryItems / plan.maxInventoryItems) * 100),
      },
      storage: {
        current: Number(subscription.storageUsed),
        max: plan.storageLimit,
        percentage: Math.round((Number(subscription.storageUsed) / plan.storageLimit) * 100),
      },
    };

    const withinLimits =
      subscription.currentUsers <= plan.maxUsers &&
      subscription.currentAssets <= plan.maxAssets &&
      subscription.currentWorkOrders <= plan.maxWorkOrders &&
      subscription.currentInventoryItems <= plan.maxInventoryItems &&
      Number(subscription.storageUsed) <= plan.storageLimit;

    return { withinLimits, usage };
  }

  // ================== Seed Default Plans ==================

  async seedDefaultPlans(): Promise<SubscriptionPlan[]> {
    const existingPlans = await this.planRepository.count();
    if (existingPlans > 0) {
      return [];
    }

    const defaultPlans: CreateSubscriptionPlanDto[] = [
      {
        name: 'Free Trial',
        description: 'Try all features for 14 days',
        price: 0,
        billingCycle: 'monthly' as any,
        maxUsers: 3,
        maxAssets: 25,
        maxWorkOrders: 50,
        maxInventoryItems: 100,
        storageLimit: 1,
        features: {
          apiAccess: false,
          advancedReporting: false,
          customBranding: false,
          prioritySupport: false,
          multiLocation: false,
          integrations: false,
          auditLogs: true,
          customRoles: false,
        },
        isTrial: true,
        trialDays: 14,
        sortOrder: 0,
      },
      {
        name: 'Starter',
        description: 'Perfect for small teams getting started',
        price: 29,
        billingCycle: 'monthly' as any,
        maxUsers: 5,
        maxAssets: 50,
        maxWorkOrders: 100,
        maxInventoryItems: 250,
        storageLimit: 5,
        features: {
          apiAccess: false,
          advancedReporting: false,
          customBranding: false,
          prioritySupport: false,
          multiLocation: false,
          integrations: false,
          auditLogs: true,
          customRoles: false,
        },
        isDefault: true,
        sortOrder: 1,
      },
      {
        name: 'Professional',
        description: 'For growing organizations with advanced needs',
        price: 79,
        billingCycle: 'monthly' as any,
        maxUsers: 20,
        maxAssets: 200,
        maxWorkOrders: 500,
        maxInventoryItems: 1000,
        storageLimit: 25,
        features: {
          apiAccess: true,
          advancedReporting: true,
          customBranding: false,
          prioritySupport: true,
          multiLocation: true,
          integrations: true,
          auditLogs: true,
          customRoles: true,
        },
        sortOrder: 2,
      },
      {
        name: 'Enterprise',
        description: 'Full-featured solution for large organizations',
        price: 199,
        billingCycle: 'monthly' as any,
        maxUsers: 100,
        maxAssets: 1000,
        maxWorkOrders: 5000,
        maxInventoryItems: 10000,
        storageLimit: 100,
        features: {
          apiAccess: true,
          advancedReporting: true,
          customBranding: true,
          prioritySupport: true,
          multiLocation: true,
          integrations: true,
          auditLogs: true,
          customRoles: true,
        },
        sortOrder: 3,
      },
    ];

    const plans: SubscriptionPlan[] = [];
    for (const planDto of defaultPlans) {
      const plan = await this.createPlan(planDto);
      plans.push(plan);
    }

    return plans;
  }
}
