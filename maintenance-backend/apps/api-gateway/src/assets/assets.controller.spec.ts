import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

describe('AssetsController', () => {
  let controller: AssetsController;
  let assetsService: AssetsService;

  const mockAssetsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAsset = {
    id: 'asset-123',
    name: 'Test Asset',
    assetCode: 'AST-001',
    type: 'Equipment',
    status: 'active',
    organizationId: 'org-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: mockAssetsService,
        },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
    assetsService = module.get<AssetsService>(AssetsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new asset', async () => {
      const createDto = {
        name: 'New Asset',
        assetCode: 'AST-002',
        type: 'Equipment',
        organizationId: 'org-123',
      };
      const req = { user: { sub: 'user-123' } };

      mockAssetsService.create.mockResolvedValue({ ...createDto, id: 'new-id' });

      const result = await controller.create(createDto, req);

      expect(result.name).toBe('New Asset');
      expect(assetsService.create).toHaveBeenCalledWith(createDto, 'user-123');
    });

    it('should handle request with user.id instead of user.sub', async () => {
      const createDto = {
        name: 'New Asset',
        assetCode: 'AST-002',
        type: 'Equipment',
        organizationId: 'org-123',
      };
      const req = { user: { id: 'user-456' } };

      mockAssetsService.create.mockResolvedValue({ ...createDto, id: 'new-id' });

      await controller.create(createDto, req);

      expect(assetsService.create).toHaveBeenCalledWith(createDto, 'user-456');
    });
  });

  describe('findAll', () => {
    it('should return all assets', async () => {
      const assets = [mockAsset, { ...mockAsset, id: 'asset-456' }];
      mockAssetsService.findAll.mockResolvedValue(assets);

      const result = await controller.findAll();

      expect(result).toEqual(assets);
      expect(result.length).toBe(2);
    });

    it('should filter by organizationId when provided', async () => {
      mockAssetsService.findAll.mockResolvedValue([mockAsset]);

      await controller.findAll('org-123');

      expect(assetsService.findAll).toHaveBeenCalledWith('org-123');
    });

    it('should return all assets when organizationId not provided', async () => {
      mockAssetsService.findAll.mockResolvedValue([mockAsset]);

      await controller.findAll();

      expect(assetsService.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findOne', () => {
    it('should return an asset by id', async () => {
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await controller.findOne('asset-123');

      expect(result).toEqual(mockAsset);
      expect(assetsService.findOne).toHaveBeenCalledWith('asset-123');
    });
  });

  describe('update', () => {
    it('should update an asset', async () => {
      const updateDto = { name: 'Updated Asset' };
      const req = { user: { sub: 'user-123' } };
      const updatedAsset = { ...mockAsset, ...updateDto };

      mockAssetsService.update.mockResolvedValue(updatedAsset);

      const result = await controller.update('asset-123', updateDto, req);

      expect(result.name).toBe('Updated Asset');
      expect(assetsService.update).toHaveBeenCalledWith('asset-123', updateDto, 'user-123');
    });
  });

  describe('remove', () => {
    it('should remove an asset', async () => {
      const req = { user: { sub: 'user-123' } };
      mockAssetsService.remove.mockResolvedValue(undefined);

      await controller.remove('asset-123', req);

      expect(assetsService.remove).toHaveBeenCalledWith('asset-123', 'user-123');
    });
  });
});
