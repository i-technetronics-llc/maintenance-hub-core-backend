import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '@app/database/entities/user.entity';
import { Company } from '@app/database/entities/company.entity';
import { Role } from '@app/database/entities/role.entity';
import { CreateUserDto, UpdateUserDto, InviteEmployeeDto, AcceptInvitationDto } from './dto';
import { EmailValidationMode, UserStatus } from '@app/common/enums';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  // Common public email domains to block
  private readonly BLOCKED_EMAIL_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'zoho.com',
    'yandex.com',
    'live.com',
    'msn.com',
    'googlemail.com',
    'me.com',
    'inbox.com',
    'gmx.com',
    'fastmail.com',
    'tutanota.com',
    'mailfence.com',
  ];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private readonly auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, createdById?: string): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });

    const saved = await this.usersRepository.save(user);

    // Audit log
    if (createdById) {
      await this.auditService.log(
        createdById,
        'CREATE',
        'User',
        saved.id,
        { email: createUserDto.email, firstName: createUserDto.firstName, lastName: createUserDto.lastName },
      );
    }

    return saved;
  }

  async findAll(companyId?: string): Promise<User[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    return this.usersRepository.find({
      where,
      relations: ['role', 'company'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'company'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, updatedById?: string): Promise<User> {
    const user = await this.findOne(id);
    const oldData = { email: user.email, firstName: user.firstName, lastName: user.lastName };

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const saved = await this.usersRepository.save(user);

    // Audit log
    if (updatedById) {
      await this.auditService.log(
        updatedById,
        'UPDATE',
        'User',
        id,
        { before: oldData, after: { firstName: updateUserDto.firstName, lastName: updateUserDto.lastName } },
      );
    }

    return saved;
  }

  async remove(id: string, deletedById?: string): Promise<void> {
    const user = await this.findOne(id);
    const deletedData = { email: user.email, firstName: user.firstName, lastName: user.lastName };

    await this.usersRepository.remove(user);

    // Audit log
    if (deletedById) {
      await this.auditService.log(
        deletedById,
        'DELETE',
        'User',
        id,
        { deleted: deletedData },
      );
    }
  }

  /**
   * Invite employee to join company
   */
  async inviteEmployee(
    companyId: string,
    inviteDto: InviteEmployeeDto,
    invitedBy: string,
  ): Promise<User> {
    const { email, firstName, lastName, roleId, phone } = inviteDto;

    // Get company
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`);
    }

    // Validate employee email
    await this.validateEmployeeEmail(email, company);

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Create user with invitation pending
    const user = this.usersRepository.create({
      email,
      firstName,
      lastName,
      phone,
      roleId,
      companyId,
      invitedBy,
      invitationToken,
      invitationAccepted: false,
      status: UserStatus.PENDING_VERIFICATION,
      isActive: false,
      emailVerified: false,
      passwordHash: '', // Will be set when accepting invitation
    });

    const savedUser = await this.usersRepository.save(user);

    // Log invitation email (in production, send actual email)
    this.logger.log(`
      ========================================
      EMPLOYEE INVITATION
      ========================================
      To: ${email}
      Subject: You're invited to join ${company.name}

      Hi ${firstName},

      You have been invited to join ${company.name} on our platform.

      Click the link below to accept your invitation and set up your account:
      http://localhost:3000/invite/accept?token=${invitationToken}

      This invitation will expire in 7 days.
      ========================================
    `);

    return savedUser;
  }

  /**
   * Validate employee email against company rules
   */
  async validateEmployeeEmail(email: string, company: Company): Promise<void> {
    // Extract domain from email
    const emailDomain = email.split('@')[1];

    // Check if email domain is a public/blocked domain
    if (this.isPublicEmailDomain(email)) {
      throw new BadRequestException(
        `Cannot use public email domain (${emailDomain}). Please use a work email address.`
      );
    }

    // If company has STRICT email validation mode
    if (company.emailValidationMode === EmailValidationMode.STRICT) {
      // Check if company domain is verified
      if (!company.isDomainVerified) {
        throw new BadRequestException(
          'Company domain must be verified before inviting employees with STRICT email validation mode. ' +
          'Please complete domain verification or switch to FLEXIBLE mode.'
        );
      }

      // Check if email domain matches company verified domain
      if (emailDomain !== company.verifiedDomain) {
        throw new BadRequestException(
          `Email domain (${emailDomain}) does not match company verified domain (${company.verifiedDomain}). ` +
          'Employee emails must use the company domain in STRICT mode.'
        );
      }
    }
  }

  /**
   * Check if email uses a public/blocked domain
   */
  isPublicEmailDomain(email: string): boolean {
    const emailDomain = email.split('@')[1].toLowerCase();
    return this.BLOCKED_EMAIL_DOMAINS.includes(emailDomain);
  }

  /**
   * Accept invitation and set password
   */
  async acceptInvitation(acceptDto: AcceptInvitationDto): Promise<User> {
    const { token, password } = acceptDto;

    // Find user by invitation token
    const user = await this.usersRepository.findOne({
      where: { invitationToken: token },
      relations: ['company', 'role'],
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    if (user.invitationAccepted) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    // Set password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.passwordHash = hashedPassword;
    user.invitationAccepted = true;
    user.invitationToken = null;
    user.isActive = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerified = true;

    const updatedUser = await this.usersRepository.save(user);

    this.logger.log(`User ${user.email} accepted invitation and activated account`);

    return updatedUser;
  }

  /**
   * Resend invitation email
   */
  async resendInvitation(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    if (user.invitationAccepted) {
      throw new BadRequestException('User has already accepted the invitation');
    }

    if (!user.invitationToken) {
      throw new BadRequestException('User was not invited via invitation system');
    }

    // Log resend invitation email (in production, send actual email)
    this.logger.log(`
      ========================================
      RESEND EMPLOYEE INVITATION
      ========================================
      To: ${user.email}
      Subject: Reminder: You're invited to join ${user.company.name}

      Hi ${user.firstName},

      This is a reminder that you have been invited to join ${user.company.name}.

      Click the link below to accept your invitation:
      http://localhost:3000/invite/accept?token=${user.invitationToken}
      ========================================
    `);

    return user;
  }

  /**
   * Cancel pending invitation
   */
  async cancelInvitation(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    if (user.invitationAccepted) {
      throw new BadRequestException('Cannot cancel invitation that has already been accepted');
    }

    if (!user.invitationToken) {
      throw new BadRequestException('User was not invited via invitation system');
    }

    // Delete the user record
    await this.usersRepository.remove(user);

    this.logger.log(`Invitation cancelled for user ${user.email}`);
  }

  /**
   * Get pending invitations for a company
   */
  async getPendingInvitations(companyId: string): Promise<User[]> {
    return await this.usersRepository.find({
      where: {
        companyId,
        invitationAccepted: false,
      },
      relations: ['role'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }
}
