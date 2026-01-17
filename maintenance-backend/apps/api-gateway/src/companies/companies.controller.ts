import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import {
  CompanySignupDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  RejectCompanyDto,
  UpdateEmailValidationModeDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@app/common/guards';
import { Permissions, Public, CurrentUser } from '@app/common/decorators';
import { CompanyStatus } from '@app/common/enums';
import { IAuthUser, IPaginationOptions } from '@app/common/interfaces';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Self-service company registration (public endpoint)' })
  @ApiResponse({ status: 201, description: 'Company registered successfully. Awaiting approval.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Company or admin email already exists' })
  async registerCompany(@Body() companySignupDto: CompanySignupDto) {
    const company = await this.companiesService.registerCompany(companySignupDto);
    return {
      success: true,
      message: 'Company registered successfully. Your account is pending approval.',
      data: company,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create company (super-admin only)' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Company already exists' })
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser('userId') superAdminId: string,
  ) {
    const company = await this.companiesService.createCompany(createCompanyDto, superAdminId);
    return {
      success: true,
      message: 'Company created successfully',
      data: company,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all companies with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'status', required: false, enum: CompanyStatus })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async getAllCompanies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('status') status?: CompanyStatus,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const paginationOptions: IPaginationOptions = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    };

    const filters = { status, type, search };

    const result = await this.companiesService.getAllCompanies(paginationOptions, filters);
    return {
      success: true,
      ...result,
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company statistics (super-admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getCompanyStatistics() {
    const statistics = await this.companiesService.getCompanyStatistics();
    return {
      success: true,
      data: statistics,
    };
  }

  @Get('pending-approval')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get companies pending approval (super-admin only)' })
  @ApiResponse({ status: 200, description: 'Pending companies retrieved successfully' })
  async getPendingApprovalCompanies() {
    const companies = await this.companiesService.getPendingApprovalCompanies();
    return {
      success: true,
      data: companies,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompanyById(@Param('id') id: string) {
    const company = await this.companiesService.getCompanyById(id);
    return {
      success: true,
      data: company,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:edit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Company name already exists' })
  async updateCompany(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const company = await this.companiesService.updateCompany(id, updateCompanyDto);
    return {
      success: true,
      message: 'Company updated successfully',
      data: company,
    };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:approve')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve company (super-admin only)' })
  @ApiResponse({ status: 200, description: 'Company approved successfully' })
  @ApiResponse({ status: 400, description: 'Company not in PENDING_APPROVAL status' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async approveCompany(
    @Param('id') id: string,
    @CurrentUser('userId') superAdminId: string,
  ) {
    const company = await this.companiesService.approveCompany(id, superAdminId);
    return {
      success: true,
      message: 'Company approved successfully. Admin users have been activated.',
      data: company,
    };
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:approve')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject company (super-admin only)' })
  @ApiResponse({ status: 200, description: 'Company rejected successfully' })
  @ApiResponse({ status: 400, description: 'Company not in PENDING_APPROVAL status' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async rejectCompany(
    @Param('id') id: string,
    @Body() rejectCompanyDto: RejectCompanyDto,
  ) {
    const company = await this.companiesService.rejectCompany(id, rejectCompanyDto);
    return {
      success: true,
      message: 'Company rejected',
      data: company,
    };
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:disable')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend company (super-admin only)' })
  @ApiResponse({ status: 200, description: 'Company suspended successfully' })
  @ApiResponse({ status: 400, description: 'Company already suspended' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async suspendCompany(@Param('id') id: string) {
    const company = await this.companiesService.suspendCompany(id);
    return {
      success: true,
      message: 'Company suspended. All company users have been deactivated.',
      data: company,
    };
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:disable')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate company (super-admin only)' })
  @ApiResponse({ status: 200, description: 'Company activated successfully' })
  @ApiResponse({ status: 400, description: 'Company already active or pending approval' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async activateCompany(@Param('id') id: string) {
    const company = await this.companiesService.activateCompany(id);
    return {
      success: true,
      message: 'Company activated. All company users have been reactivated.',
      data: company,
    };
  }

  @Patch(':id/email-validation-mode')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:edit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update email validation mode' })
  @ApiResponse({ status: 200, description: 'Email validation mode updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot enable STRICT mode without domain verification' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateEmailValidationMode(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmailValidationModeDto,
  ) {
    const company = await this.companiesService.updateEmailValidationMode(id, updateDto);
    return {
      success: true,
      message: 'Email validation mode updated successfully',
      data: company,
    };
  }
}
