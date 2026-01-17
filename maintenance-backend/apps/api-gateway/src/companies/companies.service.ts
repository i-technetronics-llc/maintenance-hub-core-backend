import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from '@app/database/entities/company.entity';
import { User } from '@app/database/entities/user.entity';
import { Role } from '@app/database/entities/role.entity';
import { OrganizationType } from '@app/database/entities/organization-type.entity';
import {
  CompanyStatus,
  EmailValidationMode,
  UserRole,
  UserStatus,
} from '@app/common/enums';
import { IPaginationOptions, IPaginatedResponse } from '@app/common/interfaces';
import {
  CompanySignupDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  RejectCompanyDto,
  UpdateEmailValidationModeDto,
} from './dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(OrganizationType)
    private organizationTypeRepository: Repository<OrganizationType>,
  ) {}

  /**
   * Self-service company registration
   * Creates company with PENDING_APPROVAL status and company admin user
   */
  async registerCompany(companySignupDto: CompanySignupDto): Promise<Company> {
    const {
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      adminPhone,
      organizationTypeCode,
      ...companyData
    } = companySignupDto;

    // Look up organization type by code
    const organizationType = await this.organizationTypeRepository.findOne({
      where: { code: organizationTypeCode.toUpperCase() },
    });

    if (!organizationType) {
      throw new BadRequestException(
        `Invalid organization type code: ${organizationTypeCode}. Valid codes are: VENDOR, CLIENT`
      );
    }

    // Check if this organization type allows self-onboarding
    if (!organizationType.allowSelfOnboarding) {
      throw new BadRequestException(
        `Self-registration is not allowed for ${organizationType.name}. Please contact a super-administrator for assistance.`
      );
    }

    // Check if company with same name already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { name: companyData.name },
    });

    if (existingCompany) {
      throw new ConflictException('Company with this name already exists');
    }

    // Check if admin email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Extract domain from website
    const verifiedDomain = this.extractDomainFromWebsite(companyData.website);

    // Validate admin email matches company domain
    const adminEmailDomain = adminEmail.split('@')[1];
    if (adminEmailDomain !== verifiedDomain) {
      throw new BadRequestException(
        `Admin email domain (${adminEmailDomain}) must match company domain (${verifiedDomain})`
      );
    }

    // Create company with PENDING_APPROVAL status
    const company = this.companyRepository.create({
      ...companyData,
      organizationTypeId: organizationType.id,
      verifiedDomain,
      status: CompanyStatus.PENDING_APPROVAL,
      emailValidationMode: EmailValidationMode.FLEXIBLE,
      isDomainVerified: false,
    });

    const savedCompany = await this.companyRepository.save(company);

    // Get COMPANY_ADMIN role
    const companyAdminRole = await this.roleRepository.findOne({
      where: { name: UserRole.COMPANY_ADMIN, isSystemRole: true },
    });

    if (!companyAdminRole) {
      throw new BadRequestException('COMPANY_ADMIN role not found. Please contact system administrator.');
    }

    // Create company admin user
    const adminUser = this.userRepository.create({
      email: adminEmail,
      passwordHash: adminPassword, // Will be hashed by @BeforeInsert hook
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: adminPhone,
      roleId: companyAdminRole.id,
      companyId: savedCompany.id,
      status: UserStatus.INACTIVE,
      isActive: false, // Inactive until company is approved
      emailVerified: false,
    });

    await this.userRepository.save(adminUser);

    return savedCompany;
  }

  /**
   * Super-admin creates company directly
   * Can set status and other settings directly
   */
  async createCompany(createCompanyDto: CreateCompanyDto, superAdminId: string): Promise<Company> {
    const { organizationTypeCode, ...companyData } = createCompanyDto;

    // Look up organization type by code
    const organizationType = await this.organizationTypeRepository.findOne({
      where: { code: organizationTypeCode.toUpperCase() },
    });

    if (!organizationType) {
      throw new BadRequestException(
        `Invalid organization type code: ${organizationTypeCode}. Valid codes are: VENDOR, CLIENT`
      );
    }

    // Check if company with same name already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { name: companyData.name },
    });

    if (existingCompany) {
      throw new ConflictException('Company with this name already exists');
    }

    // Extract domain from website if not provided
    let verifiedDomain = companyData.verifiedDomain;
    if (!verifiedDomain) {
      verifiedDomain = this.extractDomainFromWebsite(companyData.website);
    }

    const company = this.companyRepository.create({
      ...companyData,
      organizationTypeId: organizationType.id,
      verifiedDomain,
      status: companyData.status || CompanyStatus.ACTIVE,
      emailValidationMode: companyData.emailValidationMode || EmailValidationMode.FLEXIBLE,
      isDomainVerified: companyData.isDomainVerified || false,
      approvedBy: superAdminId,
      approvedAt: new Date(),
    });

    return await this.companyRepository.save(company);
  }

  /**
   * Get all companies with pagination and filters
   */
  async getAllCompanies(
    paginationOptions: IPaginationOptions = {},
    filters: {
      status?: CompanyStatus;
      type?: string;
      search?: string;
    } = {},
  ): Promise<IPaginatedResponse<Company>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = paginationOptions;

    const skip = (page - 1) * limit;

    const queryBuilder = this.companyRepository.createQueryBuilder('company');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('company.status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('company.type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(company.name ILIKE :search OR company.workEmail ILIKE :search OR company.verifiedDomain ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Apply pagination and sorting
    queryBuilder
      .orderBy(`company.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['domainVerifications'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID '${id}' not found`);
    }

    return company;
  }

  /**
   * Update company
   */
  async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.getCompanyById(id);

    // Check if updating name and if new name already exists
    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const existingCompany = await this.companyRepository.findOne({
        where: { name: updateCompanyDto.name },
      });

      if (existingCompany) {
        throw new ConflictException('Company with this name already exists');
      }
    }

    // If website is being updated, extract new domain
    if (updateCompanyDto.website && updateCompanyDto.website !== company.website) {
      const newDomain = this.extractDomainFromWebsite(updateCompanyDto.website);
      company.verifiedDomain = newDomain;
      company.isDomainVerified = false; // Reset verification status
    }

    Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(company);
  }

  /**
   * Approve company
   */
  async approveCompany(id: string, superAdminId: string): Promise<Company> {
    const company = await this.getCompanyById(id);

    if (company.status !== CompanyStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only companies with PENDING_APPROVAL status can be approved');
    }

    company.status = CompanyStatus.ACTIVE;
    company.approvedBy = superAdminId;
    company.approvedAt = new Date();

    // Activate company admin user
    const adminUsers = await this.userRepository.find({
      where: {
        companyId: id,
        roleId: (await this.roleRepository.findOne({
          where: { name: UserRole.COMPANY_ADMIN, isSystemRole: true },
        }))?.id,
      },
    });

    for (const adminUser of adminUsers) {
      adminUser.isActive = true;
      adminUser.status = UserStatus.ACTIVE;
      await this.userRepository.save(adminUser);
    }

    return await this.companyRepository.save(company);
  }

  /**
   * Reject company
   */
  async rejectCompany(id: string, rejectCompanyDto: RejectCompanyDto): Promise<Company> {
    const company = await this.getCompanyById(id);

    if (company.status !== CompanyStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only companies with PENDING_APPROVAL status can be rejected');
    }

    company.status = CompanyStatus.REJECTED;
    // Note: Rejection reason could be stored in a separate table or logged
    // For now, we just update the status

    return await this.companyRepository.save(company);
  }

  /**
   * Suspend company
   */
  async suspendCompany(id: string): Promise<Company> {
    const company = await this.getCompanyById(id);

    if (company.status === CompanyStatus.SUSPENDED) {
      throw new BadRequestException('Company is already suspended');
    }

    company.status = CompanyStatus.SUSPENDED;

    // Deactivate all company users
    await this.userRepository.update(
      { companyId: id },
      { isActive: false, status: UserStatus.INACTIVE }
    );

    return await this.companyRepository.save(company);
  }

  /**
   * Activate company
   */
  async activateCompany(id: string): Promise<Company> {
    const company = await this.getCompanyById(id);

    if (company.status === CompanyStatus.ACTIVE) {
      throw new BadRequestException('Company is already active');
    }

    if (company.status === CompanyStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Company must be approved first');
    }

    company.status = CompanyStatus.ACTIVE;

    // Reactivate all company users
    await this.userRepository.update(
      { companyId: id },
      { isActive: true, status: UserStatus.ACTIVE }
    );

    return await this.companyRepository.save(company);
  }

  /**
   * Update email validation mode
   */
  async updateEmailValidationMode(
    companyId: string,
    updateDto: UpdateEmailValidationModeDto,
  ): Promise<Company> {
    const company = await this.getCompanyById(companyId);

    // If switching to STRICT mode, verify that domain is verified
    if (
      updateDto.emailValidationMode === EmailValidationMode.STRICT &&
      !company.isDomainVerified
    ) {
      throw new BadRequestException(
        'Cannot enable STRICT email validation mode without domain verification. Please verify your domain first.'
      );
    }

    company.emailValidationMode = updateDto.emailValidationMode;
    return await this.companyRepository.save(company);
  }

  /**
   * Extract domain from website URL
   */
  extractDomainFromWebsite(website: string): string {
    try {
      const url = new URL(website);
      let hostname = url.hostname;

      // Remove 'www.' prefix if present
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }

      return hostname;
    } catch (error) {
      throw new BadRequestException('Invalid website URL');
    }
  }

  /**
   * Get companies pending approval
   */
  async getPendingApprovalCompanies(): Promise<Company[]> {
    return await this.companyRepository.find({
      where: { status: CompanyStatus.PENDING_APPROVAL },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get company statistics
   */
  async getCompanyStatistics(): Promise<any> {
    const total = await this.companyRepository.count();
    const active = await this.companyRepository.count({
      where: { status: CompanyStatus.ACTIVE },
    });
    const pending = await this.companyRepository.count({
      where: { status: CompanyStatus.PENDING_APPROVAL },
    });
    const suspended = await this.companyRepository.count({
      where: { status: CompanyStatus.SUSPENDED },
    });
    const verified = await this.companyRepository.count({
      where: { isDomainVerified: true },
    });

    return {
      total,
      active,
      pending,
      suspended,
      verified,
    };
  }
}
