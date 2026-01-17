import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CustomerPublic, CurrentCustomer, ICustomerUser } from './decorators/customer.decorator';
import {
  CustomerRegisterDto,
  CustomerLoginDto,
  CustomerForgotPasswordDto,
  CustomerResetPasswordDto,
  CreateServiceRequestDto,
  AddCommentDto,
  RateServiceDto,
} from './dto';
import { ServiceRequestStatus } from '@app/database/entities/service-request.entity';

@Controller('api/v1/portal')
@UseGuards(CustomerAuthGuard)
export class CustomerPortalController {
  constructor(
    private readonly authService: CustomerAuthService,
    private readonly portalService: CustomerPortalService,
  ) {}

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  @Post('auth/register')
  @CustomerPublic()
  async register(@Body() registerDto: CustomerRegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('auth/login')
  @CustomerPublic()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: CustomerLoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('auth/forgot-password')
  @CustomerPublic()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: CustomerForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('auth/reset-password')
  @CustomerPublic()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: CustomerResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('auth/verify-email')
  @CustomerPublic()
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('auth/profile')
  async getProfile(@CurrentCustomer() customer: ICustomerUser) {
    return this.authService.getProfile(customer.id);
  }

  // ============================================
  // DASHBOARD ENDPOINT
  // ============================================

  @Get('dashboard')
  async getDashboard(@CurrentCustomer() customer: ICustomerUser) {
    return this.portalService.getDashboardStats(customer.id);
  }

  // ============================================
  // SERVICE REQUEST ENDPOINTS
  // ============================================

  @Post('requests')
  async submitRequest(
    @CurrentCustomer() customer: ICustomerUser,
    @Body() createDto: CreateServiceRequestDto,
  ) {
    return this.portalService.submitRequest(customer.id, createDto);
  }

  @Get('requests')
  async getMyRequests(
    @CurrentCustomer() customer: ICustomerUser,
    @Query('status') status?: ServiceRequestStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.portalService.getCustomerRequests(customer.id, {
      status,
      page: page || 1,
      limit: limit || 10,
    });
  }

  @Get('requests/:id')
  async getRequestDetail(
    @CurrentCustomer() customer: ICustomerUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.portalService.getRequestById(customer.id, id);
  }

  @Post('requests/:id/comments')
  async addComment(
    @CurrentCustomer() customer: ICustomerUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() commentDto: AddCommentDto,
  ) {
    return this.portalService.addComment(customer.id, id, commentDto);
  }

  @Post('requests/:id/rate')
  async rateService(
    @CurrentCustomer() customer: ICustomerUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rateDto: RateServiceDto,
  ) {
    return this.portalService.rateService(customer.id, id, rateDto);
  }

  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================

  @Get('notifications')
  async getNotifications(
    @CurrentCustomer() customer: ICustomerUser,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.portalService.getNotifications(customer.id, {
      unreadOnly: unreadOnly === true || unreadOnly === 'true' as any,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Post('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  async markNotificationAsRead(
    @CurrentCustomer() customer: ICustomerUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.portalService.markNotificationAsRead(customer.id, id);
  }

  @Post('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  async markAllNotificationsAsRead(@CurrentCustomer() customer: ICustomerUser) {
    return this.portalService.markAllNotificationsAsRead(customer.id);
  }

  // ============================================
  // REFERENCE DATA ENDPOINTS
  // ============================================

  @Get('categories')
  @CustomerPublic()
  async getCategories() {
    return this.portalService.getServiceCategories();
  }

  @Get('locations')
  async getLocations(@CurrentCustomer() customer: ICustomerUser) {
    return this.portalService.getAvailableLocations(customer.companyId);
  }

  @Get('assets')
  async getAssets(
    @CurrentCustomer() customer: ICustomerUser,
    @Query('locationId') locationId?: string,
  ) {
    return this.portalService.getAvailableAssets(customer.companyId, locationId);
  }
}
