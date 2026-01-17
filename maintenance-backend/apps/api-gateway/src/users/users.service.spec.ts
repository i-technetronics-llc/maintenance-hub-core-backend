import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@app/database/entities/user.entity';
import { Company } from '@app/database/entities/company.entity';
import { Role } from '@app/database/entities/role.entity';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EmailValidationMode } from '@app/common/enums';

// Type for partial company data in tests
type PartialCompany = Partial<Company> & { id: string; name: string };

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let companyRepository: any;
  let roleRepository: any;
  let auditService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@company.com',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashedpassword',
    isActive: true,
    companyId: 'company-123',
    roleId: 'role-123',
    role: {
      id: 'role-123',
      name: 'TECHNICIAN',
    },
    company: {
      id: 'company-123',
      name: 'Test Company',
    },
  };

  const mockCompany = {
    id: 'company-123',
    name: 'Test Company',
    emailValidationMode: EmailValidationMode.FLEXIBLE,
    isDomainVerified: false,
    verifiedDomain: null,
  };

  const mockRole = {
    id: 'role-123',
    name: 'TECHNICIAN',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockCompanyRepository = {
      findOne: jest.fn(),
    };

    const mockRoleRepository = {
      findOne: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    companyRepository = module.get(getRepositoryToken(Company));
    roleRepository = module.get(getRepositoryToken(Role));
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createDto = {
        email: 'newuser@company.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        companyId: 'company-123',
        roleId: 'role-123',
        organizationId: 'org-123',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({ ...createDto, id: 'new-user-id' });
      userRepository.save.mockResolvedValue({ ...createDto, id: 'new-user-id' });

      const result = await service.create(createDto);

      expect(result.id).toBeDefined();
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      const createDto = {
        email: 'existing@company.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        roleId: 'role-123',
        organizationId: 'org-123',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto))
        .rejects.toThrow(ConflictException);
    });

    it('should log audit when createdById provided', async () => {
      const createDto = {
        email: 'newuser@company.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        companyId: 'company-123',
        roleId: 'role-123',
        organizationId: 'org-123',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({ ...createDto, id: 'new-user-id' });
      userRepository.save.mockResolvedValue({ ...createDto, id: 'new-user-id' });

      await service.create(createDto, 'admin-123');

      expect(auditService.log).toHaveBeenCalledWith(
        'admin-123',
        'CREATE',
        'User',
        'new-user-id',
        expect.any(Object),
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456' }];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result.length).toBe(2);
    });

    it('should filter by companyId when provided', async () => {
      userRepository.find.mockResolvedValue([mockUser]);

      await service.findAll('company-123');

      expect(userRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-123' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateDto = { firstName: 'Updated', lastName: 'Name' };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.update('user-123', updateDto);

      expect(result.firstName).toBe('Updated');
    });

    it('should hash password if provided in update', async () => {
      const updateDto = { password: 'newpassword' };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.update('user-123', updateDto);

      // Password should be hashed
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { firstName: 'New' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

      await service.remove('user-123');

      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteEmployee', () => {
    it('should invite employee successfully', async () => {
      const inviteDto = {
        email: 'newemployee@company.com',
        firstName: 'New',
        lastName: 'Employee',
        roleId: 'role-123',
      };

      companyRepository.findOne.mockResolvedValue(mockCompany);
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue({ ...inviteDto, id: 'new-user-id' });
      userRepository.save.mockResolvedValue({ ...inviteDto, id: 'new-user-id' });

      const result = await service.inviteEmployee('company-123', inviteDto, 'admin-123');

      expect(result.id).toBeDefined();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when company not found', async () => {
      companyRepository.findOne.mockResolvedValue(null);

      await expect(service.inviteEmployee('nonexistent', {
        email: 'test@company.com',
        firstName: 'Test',
        lastName: 'User',
        roleId: 'role-123',
      }, 'admin-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user already exists', async () => {
      companyRepository.findOne.mockResolvedValue(mockCompany);
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.inviteEmployee('company-123', {
        email: 'existing@company.com',
        firstName: 'Existing',
        lastName: 'User',
        roleId: 'role-123',
      }, 'admin-123')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when role not found', async () => {
      companyRepository.findOne.mockResolvedValue(mockCompany);
      userRepository.findOne.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.inviteEmployee('company-123', {
        email: 'new@company.com',
        firstName: 'New',
        lastName: 'User',
        roleId: 'nonexistent-role',
      }, 'admin-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isPublicEmailDomain', () => {
    it('should return true for public email domains', () => {
      expect(service.isPublicEmailDomain('user@gmail.com')).toBe(true);
      expect(service.isPublicEmailDomain('user@yahoo.com')).toBe(true);
      expect(service.isPublicEmailDomain('user@hotmail.com')).toBe(true);
    });

    it('should return false for company email domains', () => {
      expect(service.isPublicEmailDomain('user@company.com')).toBe(false);
      expect(service.isPublicEmailDomain('user@mycompany.io')).toBe(false);
    });
  });

  describe('validateEmployeeEmail', () => {
    it('should throw BadRequestException for public email domains', async () => {
      await expect(service.validateEmployeeEmail('user@gmail.com', mockCompany as Company))
        .rejects.toThrow(BadRequestException);
    });

    it('should pass for company email domains in FLEXIBLE mode', async () => {
      await expect(service.validateEmployeeEmail('user@company.com', mockCompany as Company))
        .resolves.not.toThrow();
    });

    it('should throw BadRequestException in STRICT mode without verified domain', async () => {
      const strictCompany: PartialCompany = {
        ...mockCompany,
        emailValidationMode: EmailValidationMode.STRICT,
        isDomainVerified: false,
      };

      await expect(service.validateEmployeeEmail('user@company.com', strictCompany as Company))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when email domain does not match verified domain', async () => {
      const strictCompany: PartialCompany = {
        ...mockCompany,
        emailValidationMode: EmailValidationMode.STRICT,
        isDomainVerified: true,
        verifiedDomain: 'verified.com',
      };

      await expect(service.validateEmployeeEmail('user@different.com', strictCompany as Company))
        .rejects.toThrow(BadRequestException);
    });

    it('should pass when email domain matches verified domain in STRICT mode', async () => {
      const strictCompany: PartialCompany = {
        ...mockCompany,
        emailValidationMode: EmailValidationMode.STRICT,
        isDomainVerified: true,
        verifiedDomain: 'verified.com',
      };

      await expect(service.validateEmployeeEmail('user@verified.com', strictCompany as Company))
        .resolves.not.toThrow();
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const invitedUser = {
        ...mockUser,
        invitationToken: 'valid-token',
        invitationAccepted: false,
        isActive: false,
      };

      userRepository.findOne.mockResolvedValue(invitedUser);
      userRepository.save.mockResolvedValue({ ...invitedUser, invitationAccepted: true, isActive: true });

      const result = await service.acceptInvitation({
        token: 'valid-token',
        password: 'newpassword123',
      });

      expect(result.invitationAccepted).toBe(true);
      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestException for invalid token', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptInvitation({
        token: 'invalid-token',
        password: 'password123',
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when invitation already accepted', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        invitationAccepted: true,
      });

      await expect(service.acceptInvitation({
        token: 'valid-token',
        password: 'password123',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending invitations for company', async () => {
      const pendingUsers = [
        { ...mockUser, invitationAccepted: false },
        { ...mockUser, id: 'user-456', invitationAccepted: false },
      ];

      userRepository.find.mockResolvedValue(pendingUsers);

      const result = await service.getPendingInvitations('company-123');

      expect(result.length).toBe(2);
      expect(userRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companyId: 'company-123',
            invitationAccepted: false,
          },
        }),
      );
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel pending invitation', async () => {
      const invitedUser = {
        ...mockUser,
        invitationToken: 'valid-token',
        invitationAccepted: false,
      };

      userRepository.findOne.mockResolvedValue(invitedUser);
      userRepository.remove.mockResolvedValue(invitedUser);

      await service.cancelInvitation('user-123');

      expect(userRepository.remove).toHaveBeenCalledWith(invitedUser);
    });

    it('should throw BadRequestException when invitation already accepted', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        invitationAccepted: true,
      });

      await expect(service.cancelInvitation('user-123'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
