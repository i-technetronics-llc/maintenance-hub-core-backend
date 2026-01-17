import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@app/database/entities/user.entity';
import { Role } from '@app/database/entities/role.entity';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let roleRepository: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: '$2b$10$hashedpassword',
    isActive: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    role: {
      id: 'role-123',
      name: 'TECHNICIAN',
      permissions: ['assets:read', 'work-orders:read'],
      rolePermissions: [],
    },
    company: {
      id: 'company-123',
      name: 'Test Company',
      type: 'maintenance',
    },
    roleId: 'role-123',
    companyId: 'company-123',
  };

  const mockRole = {
    id: 'role-123',
    name: 'TECHNICIAN',
    permissions: ['assets:read'],
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockRoleRepository = {
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without passwordHash when credentials are valid', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      userRepository.findOne.mockResolvedValue(userWithHash);

      const result = await service.validateUser('test@example.com', password);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser('notfound@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.validateUser('test@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.validateUser('test@example.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      userRepository.findOne.mockResolvedValue(userWithHash);
      userRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.login({ email: 'test@example.com', password });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login({ email: 'notfound@example.com', password: 'password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should require MFA when enabled but token not provided', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithMfa = { ...mockUser, passwordHash: hashedPassword, twoFactorEnabled: true };

      userRepository.findOne.mockResolvedValue(userWithMfa);

      const result = await service.login({ email: 'test@example.com', password });

      expect(result.requiresMfa).toBe(true);
      expect(result.message).toContain('Multi-factor authentication');
    });
  });

  describe('getProfile', () => {
    it('should return user profile without sensitive data', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      // Sensitive data should be stripped by the service
      expect((result as any).passwordHash).toBeUndefined();
      expect((result as any).twoFactorSecret).toBeUndefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue({ ...mockUser, id: 'new-user-id' });
      userRepository.save.mockResolvedValue({ ...mockUser, id: 'new-user-id' });

      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        companyId: 'company-123',
      };

      const result = await service.register(registerDto);

      expect(result.message).toContain('Registration successful');
      expect(result.userId).toBeDefined();
    });

    it('should throw BadRequestException when user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        companyId: 'company-123',
      };

      await expect(service.register(registerDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when default role not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(null);

      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        companyId: 'company-123',
      };

      await expect(service.register(registerDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should return logout success message', async () => {
      const result = await service.logout();

      expect(result.message).toBe('Logout successful');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'oldpassword';
      const hashedOldPassword = await bcrypt.hash(oldPassword, 10);
      const userWithHash = { ...mockUser, passwordHash: hashedOldPassword };

      userRepository.findOne.mockResolvedValue(userWithHash);
      userRepository.save.mockResolvedValue(userWithHash);

      const result = await service.changePassword('user-123', {
        oldPassword,
        newPassword: 'newpassword123',
      });

      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword('nonexistent', {
        oldPassword: 'old',
        newPassword: 'new',
      })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when old password is incorrect', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.changePassword('user-123', {
        oldPassword: 'wrongpassword',
        newPassword: 'newpassword',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should return success message regardless of user existence', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'notfound@example.com' });

      expect(result.message).toContain('If an account with that email exists');
    });

    it('should generate reset token for existing user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.message).toContain('If an account with that email exists');
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const userWithToken = {
        ...mockUser,
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() + 3600000),
      };

      userRepository.findOne.mockResolvedValue(userWithToken);
      userRepository.save.mockResolvedValue(userWithToken);

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newpassword123',
      });

      expect(result.message).toContain('Password reset successful');
    });

    it('should throw BadRequestException with invalid token', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword({
        token: 'invalid-token',
        newPassword: 'newpassword',
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with expired token', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        passwordResetToken: 'expired-token',
        passwordResetExpires: new Date(Date.now() - 3600000),
      };

      userRepository.findOne.mockResolvedValue(userWithExpiredToken);

      await expect(service.resetPassword({
        token: 'expired-token',
        newPassword: 'newpassword',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('enableMFA', () => {
    it('should generate MFA secret and QR code', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, twoFactorEnabled: false });
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.enableMFA('user-123');

      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.message).toContain('Scan the QR code');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.enableMFA('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when MFA already enabled', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, twoFactorEnabled: true });

      await expect(service.enableMFA('user-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('disableMFA', () => {
    it('should disable MFA successfully', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'secret' });
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.disableMFA('user-123');

      expect(result.message).toContain('disabled successfully');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.disableMFA('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when MFA not enabled', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, twoFactorEnabled: false });

      await expect(service.disableMFA('user-123'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
