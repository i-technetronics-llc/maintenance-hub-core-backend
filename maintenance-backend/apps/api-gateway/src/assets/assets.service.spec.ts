import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Asset } from '@app/database/entities/asset.entity';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@app/common/enums';

describe('AssetsService', () => {
  let service: AssetsService;
  let assetRepository: any;
  let auditService: any;

  const mockAsset = {
    id: 'asset-123',
    name: 'Test Asset',
    assetCode: 'AST-001',
    type: 'Equipment',
    status: 'active',
    manufacturer: 'Test Manufacturer',
    model: 'Model X',
    serialNumber: 'SN12345',
    organizationId: 'org-123',
    organization: {
      id: 'org-123',
      name: 'Test Organization',
    },
    location: {
      id: 'loc-123',
      name: 'Main Building',
    },
  };

  beforeEach(async () => {
    const mockAssetRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    assetRepository = module.get(getRepositoryToken(Asset));
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an asset successfully', async () => {
      const createAssetDto = {
        name: 'New Asset',
        assetCode: 'AST-002',
        type: 'Equipment',
        organizationId: 'org-123',
      };

      assetRepository.create.mockReturnValue({ ...createAssetDto, id: 'new-asset-id' });
      assetRepository.save.mockResolvedValue({ ...createAssetDto, id: 'new-asset-id' });

      const result = await service.create(createAssetDto);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Asset');
      expect(assetRepository.create).toHaveBeenCalledWith(createAssetDto);
      expect(assetRepository.save).toHaveBeenCalled();
    });

    it('should create asset and log audit when userId provided', async () => {
      const createAssetDto = {
        name: 'New Asset',
        assetCode: 'AST-002',
        type: 'Equipment',
        organizationId: 'org-123',
      };
      const userId = 'user-123';

      assetRepository.create.mockReturnValue({ ...createAssetDto, id: 'new-asset-id' });
      assetRepository.save.mockResolvedValue({ ...createAssetDto, id: 'new-asset-id' });

      await service.create(createAssetDto, userId);

      expect(auditService.log).toHaveBeenCalledWith(
        userId,
        'CREATE',
        'Asset',
        'new-asset-id',
        expect.any(Object),
      );
    });

    it('should not log audit when userId not provided', async () => {
      const createAssetDto = {
        name: 'New Asset',
        assetCode: 'AST-002',
        type: 'Equipment',
        organizationId: 'org-123',
      };

      assetRepository.create.mockReturnValue({ ...createAssetDto, id: 'new-asset-id' });
      assetRepository.save.mockResolvedValue({ ...createAssetDto, id: 'new-asset-id' });

      await service.create(createAssetDto);

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all assets', async () => {
      const assets = [mockAsset, { ...mockAsset, id: 'asset-456', name: 'Asset 2' }];
      assetRepository.find.mockResolvedValue(assets);

      const result = await service.findAll();

      expect(result).toEqual(assets);
      expect(result.length).toBe(2);
    });

    it('should filter by organizationId when provided', async () => {
      assetRepository.find.mockResolvedValue([mockAsset]);

      await service.findAll('org-123');

      expect(assetRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
        relations: ['organization'],
      });
    });

    it('should return all assets when organizationId not provided', async () => {
      assetRepository.find.mockResolvedValue([mockAsset]);

      await service.findAll();

      expect(assetRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['organization'],
      });
    });
  });

  describe('findOne', () => {
    it('should return an asset by id', async () => {
      assetRepository.findOne.mockResolvedValue(mockAsset);

      const result = await service.findOne('asset-123');

      expect(result).toEqual(mockAsset);
      expect(assetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
        relations: ['organization', 'location'],
      });
    });

    it('should throw NotFoundException when asset not found', async () => {
      assetRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an asset successfully', async () => {
      const updateDto = { name: 'Updated Asset Name', status: AssetStatus.UNDER_MAINTENANCE };
      const updatedAsset = { ...mockAsset, ...updateDto };

      assetRepository.findOne.mockResolvedValue(mockAsset);
      assetRepository.save.mockResolvedValue(updatedAsset);

      const result = await service.update('asset-123', updateDto);

      expect(result.name).toBe('Updated Asset Name');
      expect(result.status).toBe(AssetStatus.UNDER_MAINTENANCE);
    });

    it('should log audit when userId provided', async () => {
      const updateDto = { name: 'Updated Asset' };
      const userId = 'user-123';

      assetRepository.findOne.mockResolvedValue(mockAsset);
      assetRepository.save.mockResolvedValue({ ...mockAsset, ...updateDto });

      await service.update('asset-123', updateDto, userId);

      expect(auditService.log).toHaveBeenCalledWith(
        userId,
        'UPDATE',
        'Asset',
        'asset-123',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when asset not found', async () => {
      assetRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', { name: 'New Name' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an asset successfully', async () => {
      assetRepository.findOne.mockResolvedValue(mockAsset);
      assetRepository.remove.mockResolvedValue(mockAsset);

      await service.remove('asset-123');

      expect(assetRepository.remove).toHaveBeenCalledWith(mockAsset);
    });

    it('should log audit when userId provided', async () => {
      const userId = 'user-123';

      assetRepository.findOne.mockResolvedValue(mockAsset);
      assetRepository.remove.mockResolvedValue(mockAsset);

      await service.remove('asset-123', userId);

      expect(auditService.log).toHaveBeenCalledWith(
        userId,
        'DELETE',
        'Asset',
        'asset-123',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when asset not found', async () => {
      assetRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
