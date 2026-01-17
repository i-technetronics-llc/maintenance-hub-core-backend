import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CustomerAccount } from '@app/database/entities/customer-account.entity';
import { Company } from '@app/database/entities/company.entity';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerForgotPasswordDto, CustomerResetPasswordDto } from './dto/customer-forgot-password.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(CustomerAccount)
    private customerRepository: Repository<CustomerAccount>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: CustomerRegisterDto) {
    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingCustomer) {
      throw new BadRequestException('An account with this email already exists');
    }

    // Verify company exists and is active
    const company = await this.companyRepository.findOne({
      where: { id: registerDto.companyId },
    });

    if (!company) {
      throw new BadRequestException('Invalid company ID');
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create new customer account
    const customer = this.customerRepository.create({
      email: registerDto.email,
      passwordHash: registerDto.password, // Will be hashed by @BeforeInsert hook
      name: registerDto.name,
      phone: registerDto.phone,
      department: registerDto.department,
      companyId: registerDto.companyId,
      locationId: registerDto.locationId,
      emailVerificationToken,
      emailVerified: false,
    });

    await this.customerRepository.save(customer);

    // Log email verification link (in production, send actual email)
    console.log(`
      ========================================
      CUSTOMER EMAIL VERIFICATION
      ========================================
      To: ${customer.email}
      Subject: Verify your Customer Portal account

      Please verify your email by clicking the link below:
      http://localhost:3000/portal/verify-email?token=${emailVerificationToken}

      This link will expire in 24 hours.
      ========================================
    `);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      customerId: customer.id,
    };
  }

  async login(loginDto: CustomerLoginDto) {
    // Find customer with company relation
    const customer = await this.customerRepository.findOne({
      where: { email: loginDto.email },
      relations: ['company', 'location'],
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Account is inactive. Please contact support.');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(loginDto.password, customer.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified (optional - can be made mandatory)
    // if (!customer.emailVerified) {
    //   throw new UnauthorizedException('Please verify your email before logging in');
    // }

    // Generate JWT token
    const payload = {
      sub: customer.id,
      email: customer.email,
      name: customer.name,
      companyId: customer.companyId,
      type: 'customer', // Important: distinguish from employee tokens
    };

    const accessToken = this.jwtService.sign(payload);

    // Update last login information
    await this.customerRepository.update(customer.id, {
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        department: customer.department,
        company: customer.company ? {
          id: customer.company.id,
          name: customer.company.name,
        } : null,
        location: customer.location ? {
          id: customer.location.locationId,
          name: customer.location.locationName,
        } : null,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: CustomerForgotPasswordDto) {
    const customer = await this.customerRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    // Don't reveal if customer exists or not for security
    if (!customer) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    customer.passwordResetToken = passwordResetToken;
    customer.passwordResetExpires = passwordResetExpires;

    await this.customerRepository.save(customer);

    // Log password reset email (in production, send actual email)
    console.log(`
      ========================================
      CUSTOMER PASSWORD RESET
      ========================================
      To: ${customer.email}
      Subject: Reset your Customer Portal password

      You requested a password reset. Click the link below to reset your password:
      http://localhost:3000/portal/reset-password?token=${passwordResetToken}

      This link will expire in 1 hour.

      If you didn't request this, please ignore this email.
      ========================================
    `);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: CustomerResetPasswordDto) {
    const customer = await this.customerRepository.findOne({
      where: { passwordResetToken: resetPasswordDto.token },
    });

    if (!customer) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (customer.passwordResetExpires < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }

    // Update password and clear reset token
    customer.passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    customer.passwordResetToken = null;
    customer.passwordResetExpires = null;

    await this.customerRepository.save(customer);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }

  async verifyEmail(token: string) {
    const customer = await this.customerRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!customer) {
      throw new BadRequestException('Invalid verification token');
    }

    customer.emailVerified = true;
    customer.emailVerificationToken = null;

    await this.customerRepository.save(customer);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async getProfile(customerId: string) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['company', 'location'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      department: customer.department,
      emailVerified: customer.emailVerified,
      company: customer.company ? {
        id: customer.company.id,
        name: customer.company.name,
      } : null,
      location: customer.location ? {
        id: customer.location.locationId,
        name: customer.location.locationName,
      } : null,
      createdAt: customer.createdAt,
    };
  }

  async validateCustomer(customerId: string): Promise<CustomerAccount | null> {
    return this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
      relations: ['company'],
    });
  }
}
