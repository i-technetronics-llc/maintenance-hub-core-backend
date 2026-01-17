import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '@app/database/entities/settings.entity';
import { CreateSettingDto, UpdateSettingDto } from './dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<Settings> {
    // Check if setting with same module and key already exists
    const existingSetting = await this.settingsRepository.findOne({
      where: {
        module: createSettingDto.module,
        key: createSettingDto.key,
        companyId: createSettingDto.companyId || null,
      },
    });

    if (existingSetting) {
      throw new ConflictException(
        `Setting with module "${createSettingDto.module}" and key "${createSettingDto.key}" already exists`,
      );
    }

    const setting = this.settingsRepository.create(createSettingDto);
    return await this.settingsRepository.save(setting);
  }

  async findAll(params?: {
    module?: string;
    companyId?: string;
  }): Promise<Settings[]> {
    const where: any = {};

    if (params?.module) {
      where.module = params.module;
    }

    if (params?.companyId) {
      where.companyId = params.companyId;
    }

    return await this.settingsRepository.find({
      where,
      order: { module: 'ASC', key: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Settings> {
    const setting = await this.settingsRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID "${id}" not found`);
    }

    return setting;
  }

  async findByModuleAndKey(
    module: string,
    key: string,
    companyId?: string,
  ): Promise<Settings | null> {
    return await this.settingsRepository.findOne({
      where: {
        module,
        key,
        companyId: companyId || null,
      },
    });
  }

  async getModules(): Promise<string[]> {
    const result = await this.settingsRepository
      .createQueryBuilder('settings')
      .select('DISTINCT settings.module', 'module')
      .orderBy('settings.module', 'ASC')
      .getRawMany();

    return result.map((r) => r.module);
  }

  async update(id: string, updateSettingDto: UpdateSettingDto): Promise<Settings> {
    const setting = await this.findOne(id);

    // Check if updating to a module/key that already exists
    if (
      (updateSettingDto.module && updateSettingDto.module !== setting.module) ||
      (updateSettingDto.key && updateSettingDto.key !== setting.key)
    ) {
      const existingSetting = await this.findByModuleAndKey(
        updateSettingDto.module || setting.module,
        updateSettingDto.key || setting.key,
        updateSettingDto.companyId || setting.companyId,
      );

      if (existingSetting && existingSetting.id !== id) {
        throw new ConflictException(
          `Setting with this module and key already exists`,
        );
      }
    }

    Object.assign(setting, updateSettingDto);
    return await this.settingsRepository.save(setting);
  }

  async remove(id: string): Promise<void> {
    const setting = await this.findOne(id);
    await this.settingsRepository.remove(setting);
  }

  async upsert(createSettingDto: CreateSettingDto): Promise<Settings> {
    const existingSetting = await this.findByModuleAndKey(
      createSettingDto.module,
      createSettingDto.key,
      createSettingDto.companyId,
    );

    if (existingSetting) {
      Object.assign(existingSetting, createSettingDto);
      return await this.settingsRepository.save(existingSetting);
    }

    const setting = this.settingsRepository.create(createSettingDto);
    return await this.settingsRepository.save(setting);
  }

  async getDefaultSettings(): Promise<Record<string, any>> {
    return {
      inventory: {
        low_stock_threshold: { threshold: 10, alertEnabled: true },
        auto_reorder: { enabled: false, threshold: 5 },
        track_expiry: { enabled: true, alertDays: 30 },
      },
      work_orders: {
        auto_assign: { enabled: false },
        require_approval: { enabled: true, threshold: 1000 },
        sla_tracking: { enabled: true },
      },
      notifications: {
        email_alerts: { enabled: true },
        low_stock_alerts: { enabled: true },
        work_order_updates: { enabled: true },
      },
      general: {
        timezone: { value: 'UTC' },
        date_format: { value: 'YYYY-MM-DD' },
        currency: { value: 'USD' },
      },
    };
  }

  async initializeDefaultSettings(companyId?: string): Promise<Settings[]> {
    const defaults = await this.getDefaultSettings();
    const settings: Settings[] = [];

    for (const [module, keys] of Object.entries(defaults)) {
      for (const [key, value] of Object.entries(keys)) {
        const existing = await this.findByModuleAndKey(module, key, companyId);
        if (!existing) {
          const setting = await this.create({
            companyId,
            module,
            key,
            value,
            isEnabled: true,
          });
          settings.push(setting);
        }
      }
    }

    return settings;
  }
}
