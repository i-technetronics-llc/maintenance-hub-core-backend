import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    enableMFA: jest.fn(),
    verifyMFA: jest.fn(),
    disableMFA: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const expectedResponse = {
        accessToken: 'mock-token',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login with MFA requirement', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mfaResponse = {
        requiresMfa: true,
        message: 'MFA required',
      };

      mockAuthService.login.mockResolvedValue(mfaResponse);

      const result = await controller.login(loginDto);

      expect(result.requiresMfa).toBe(true);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        companyId: 'company-123',
      };
      const expectedResponse = {
        message: 'Registration successful',
        userId: 'new-user-id',
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('logout', () => {
    it('should return logout success message', async () => {
      const expectedResponse = { message: 'Logout successful' };

      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout();

      expect(result).toEqual(expectedResponse);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = { user: { userId: 'user-123' } };

      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getMe', () => {
    it('should return user profile (alias)', async () => {
      const req = { user: { userId: 'user-123' } };

      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getMe(req);

      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const req = { user: { userId: 'user-123' } };
      const updateDto = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateDto };

      mockAuthService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(req, updateDto);

      expect(result).toEqual(updatedUser);
      expect(authService.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const req = { user: { userId: 'user-123' } };
      const changePasswordDto = {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword',
      };
      const expectedResponse = { message: 'Password changed successfully' };

      mockAuthService.changePassword.mockResolvedValue(expectedResponse);

      const result = await controller.changePassword(req, changePasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.changePassword).toHaveBeenCalledWith('user-123', changePasswordDto);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      const expectedResponse = {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordDto = {
        token: 'valid-token',
        newPassword: 'newpassword123',
      };
      const expectedResponse = { message: 'Password reset successful' };

      mockAuthService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('enableMFA', () => {
    it('should enable MFA and return QR code', async () => {
      const req = { user: { userId: 'user-123' } };
      const expectedResponse = {
        secret: 'ABCDEF123456',
        qrCode: 'data:image/png;base64,...',
        message: 'Scan the QR code',
      };

      mockAuthService.enableMFA.mockResolvedValue(expectedResponse);

      const result = await controller.enableMFA(req);

      expect(result).toEqual(expectedResponse);
      expect(authService.enableMFA).toHaveBeenCalledWith('user-123');
    });
  });

  describe('verifyMFA', () => {
    it('should verify MFA code', async () => {
      const req = { user: { userId: 'user-123' } };
      const verifyMfaDto = { token: '123456' };
      const expectedResponse = {
        message: 'MFA enabled successfully',
        enabled: true,
      };

      mockAuthService.verifyMFA.mockResolvedValue(expectedResponse);

      const result = await controller.verifyMFA(req, verifyMfaDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.verifyMFA).toHaveBeenCalledWith('user-123', verifyMfaDto);
    });
  });

  describe('disableMFA', () => {
    it('should disable MFA', async () => {
      const req = { user: { userId: 'user-123' } };
      const expectedResponse = { message: 'MFA disabled successfully' };

      mockAuthService.disableMFA.mockResolvedValue(expectedResponse);

      const result = await controller.disableMFA(req);

      expect(result).toEqual(expectedResponse);
      expect(authService.disableMFA).toHaveBeenCalledWith('user-123');
    });
  });
});
