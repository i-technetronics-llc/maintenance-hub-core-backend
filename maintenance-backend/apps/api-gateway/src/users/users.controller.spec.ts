import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    inviteEmployee: jest.fn(),
    acceptInvitation: jest.fn(),
    resendInvitation: jest.fn(),
    cancelInvitation: jest.fn(),
    getPendingInvitations: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@company.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'newuser@company.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        roleId: 'role-123',
        organizationId: 'org-123',
      };

      mockUsersService.create.mockResolvedValue({ ...createDto, id: 'new-id' });

      const result = await controller.create(createDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User created successfully');
      expect(result.data).toBeDefined();
      expect(usersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456' }];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(users);
      expect(result.data.length).toBe(2);
    });

    it('should filter by companyId when provided', async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);

      await controller.findAll('company-123');

      expect(usersService.findAll).toHaveBeenCalledWith('company-123');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith('user-123');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateDto };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-123', updateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User updated successfully');
      expect(result.data.firstName).toBe('Updated');
      expect(usersService.update).toHaveBeenCalledWith('user-123', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('user-123');

      expect(usersService.remove).toHaveBeenCalledWith('user-123');
    });
  });

  describe('inviteEmployee', () => {
    it('should invite an employee', async () => {
      const inviteDto = {
        email: 'newemployee@company.com',
        firstName: 'New',
        lastName: 'Employee',
        roleId: 'role-123',
      };
      const invitedUser = { ...inviteDto, id: 'new-user-id' };

      mockUsersService.inviteEmployee.mockResolvedValue(invitedUser);

      const result = await controller.inviteEmployee(inviteDto, 'company-123', 'admin-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('invitation sent successfully');
      expect(usersService.inviteEmployee).toHaveBeenCalledWith('company-123', inviteDto, 'admin-123');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation', async () => {
      const acceptDto = {
        token: 'valid-token',
        password: 'newpassword123',
      };
      const acceptedUser = { ...mockUser, invitationAccepted: true };

      mockUsersService.acceptInvitation.mockResolvedValue(acceptedUser);

      const result = await controller.acceptInvitation(acceptDto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Invitation accepted successfully');
      expect(result.data.id).toBe(acceptedUser.id);
      expect(usersService.acceptInvitation).toHaveBeenCalledWith(acceptDto);
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation', async () => {
      mockUsersService.resendInvitation.mockResolvedValue(mockUser);

      const result = await controller.resendInvitation('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation email resent successfully');
      expect(usersService.resendInvitation).toHaveBeenCalledWith('user-123');
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel invitation', async () => {
      mockUsersService.cancelInvitation.mockResolvedValue(undefined);

      await controller.cancelInvitation('user-123');

      expect(usersService.cancelInvitation).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending invitations', async () => {
      const pendingUsers = [
        { ...mockUser, invitationAccepted: false },
        { ...mockUser, id: 'user-456', invitationAccepted: false },
      ];

      mockUsersService.getPendingInvitations.mockResolvedValue(pendingUsers);

      const result = await controller.getPendingInvitations('company-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(pendingUsers);
      expect(usersService.getPendingInvitations).toHaveBeenCalledWith('company-123');
    });
  });
});
