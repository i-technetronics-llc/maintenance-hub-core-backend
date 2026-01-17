import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import { User } from '@app/database/entities/user.entity';
import { Role } from '@app/database/entities/role.entity';
import { UserRole } from '@app/common/enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'company'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto & { mfaToken?: string }) {
    // Fetch user with role permissions
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission', 'company'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if MFA is enabled for this user
    if (user.twoFactorEnabled) {
      if (!loginDto.mfaToken) {
        // MFA is required but token not provided
        return {
          requiresMfa: true,
          message: 'Multi-factor authentication is required. Please provide your MFA code.',
        };
      }

      // Verify MFA token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: loginDto.mfaToken,
        window: 2, // Allow 2 time steps before/after for clock drift
      });

      if (!verified) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Aggregate permissions from role.permissions (JSONB) and role.rolePermissions
    let permissions: string[] = [];

    // Check if role has wildcard permissions
    if (user.role.permissions && user.role.permissions.includes('*')) {
      permissions = ['*'];
    } else {
      // Combine JSONB permissions and junction table permissions
      const jsonbPermissions = user.role.permissions || [];
      const junctionPermissions = user.role.rolePermissions
        ? user.role.rolePermissions
            .filter(rp => rp.permission && rp.permission.isActive)
            .map(rp => rp.permission.code)
        : [];

      permissions = [...new Set([...jsonbPermissions, ...junctionPermissions])];
    }

    const isSuperAdmin = user.role.name === UserRole.SUPER_ADMIN;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      companyId: user.companyId,
      companyType: user.company?.type,
      permissions,
      isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(payload);

    // Update last login information
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions,
        },
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          type: user.company.type,
        } : null,
        isSuperAdmin,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'company'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, twoFactorSecret, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Get roleId - either from DTO or default to TECHNICIAN
    let roleId = registerDto.roleId;
    if (!roleId) {
      const defaultRole = await this.roleRepository.findOne({
        where: { name: UserRole.TECHNICIAN },
      });
      if (!defaultRole) {
        throw new BadRequestException('Default role not found. Please contact administrator.');
      }
      roleId = defaultRole.id;
    } else {
      // Verify the provided roleId exists
      const role = await this.roleRepository.findOne({
        where: { id: roleId },
      });
      if (!role) {
        throw new BadRequestException('Invalid role ID provided');
      }
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash: registerDto.password, // Will be hashed by @BeforeInsert hook
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      companyId: registerDto.companyId,
      roleId: roleId,
      emailVerificationToken,
      emailVerified: false,
    });

    await this.userRepository.save(user);

    // Log email verification link (in production, send actual email)
    console.log(`
      ========================================
      EMAIL VERIFICATION
      ========================================
      To: ${user.email}
      Subject: Verify your email address

      Please verify your email by clicking the link below:
      http://localhost:3000/auth/verify-email?token=${emailVerificationToken}

      This link will expire in 24 hours.
      ========================================
    `);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async logout() {
    // For stateless JWT, logout is handled client-side
    // This endpoint is provided for consistency and future token blacklisting
    return {
      message: 'Logout successful',
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }

      // If email is changed, require re-verification
      user.emailVerified = false;
      user.emailVerificationToken = crypto.randomBytes(32).toString('hex');

      console.log(`
        ========================================
        EMAIL VERIFICATION (Email Changed)
        ========================================
        To: ${updateProfileDto.email}
        Subject: Verify your new email address

        Please verify your new email by clicking the link below:
        http://localhost:3000/auth/verify-email?token=${user.emailVerificationToken}
        ========================================
      `);
    }

    // Update user fields
    if (updateProfileDto.firstName) user.firstName = updateProfileDto.firstName;
    if (updateProfileDto.lastName) user.lastName = updateProfileDto.lastName;
    if (updateProfileDto.email) user.email = updateProfileDto.email;

    await this.userRepository.save(user);

    const { passwordHash, twoFactorSecret, ...result } = user;
    return result;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and update new password
    user.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.save(user);

    return {
      message: 'Password changed successfully',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;

    await this.userRepository.save(user);

    // Log password reset email (in production, send actual email)
    console.log(`
      ========================================
      PASSWORD RESET
      ========================================
      To: ${user.email}
      Subject: Reset your password

      You requested a password reset. Click the link below to reset your password:
      http://localhost:3000/auth/reset-password?token=${passwordResetToken}

      This link will expire in 1 hour.

      If you didn't request this, please ignore this email.
      ========================================
    `);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: resetPasswordDto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }

    // Update password and clear reset token
    user.passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.userRepository.save(user);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }

  async enableMFA(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Maintenance Platform (${user.email})`,
      issuer: 'Maintenance Platform',
    });

    // Save the secret (not yet enabled)
    user.twoFactorSecret = secret.base32;
    await this.userRepository.save(user);

    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      message: 'Scan the QR code with your authenticator app and verify with a code to enable MFA',
    };
  }

  async verifyMFA(userId: string, verifyMfaDto: VerifyMfaDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not set up. Please enable MFA first.');
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: verifyMfaDto.token,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    if (!verified) {
      throw new BadRequestException('Invalid authentication code');
    }

    // Enable MFA if not already enabled
    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await this.userRepository.save(user);

      return {
        message: 'Two-factor authentication enabled successfully',
        enabled: true,
      };
    }

    return {
      message: 'Authentication code verified successfully',
      verified: true,
    };
  }

  async disableMFA(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Disable MFA and clear secret
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;

    await this.userRepository.save(user);

    return {
      message: 'Two-factor authentication disabled successfully',
    };
  }
}
