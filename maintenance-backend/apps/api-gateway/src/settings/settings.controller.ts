import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto';
import { JwtAuthGuard } from '@app/common/guards';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  @ApiResponse({ status: 409, description: 'Setting already exists' })
  async create(@Body() createSettingDto: CreateSettingDto) {
    const setting = await this.settingsService.create(createSettingDto);
    return {
      success: true,
      message: 'Setting created successfully',
      data: setting,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiQuery({ name: 'module', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  async findAll(
    @Query('module') module?: string,
    @Query('companyId') companyId?: string,
  ) {
    const settings = await this.settingsService.findAll({ module, companyId });
    return {
      success: true,
      data: settings,
    };
  }

  @Get('modules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available modules' })
  @ApiResponse({ status: 200, description: 'Modules retrieved successfully' })
  async getModules() {
    const modules = await this.settingsService.getModules();
    return {
      success: true,
      data: modules,
    };
  }

  @Get('defaults')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get default settings structure' })
  @ApiResponse({ status: 200, description: 'Default settings retrieved successfully' })
  async getDefaultSettings() {
    const defaults = await this.settingsService.getDefaultSettings();
    return {
      success: true,
      data: defaults,
    };
  }

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize default settings' })
  @ApiResponse({ status: 201, description: 'Default settings initialized successfully' })
  async initializeDefaults(@Query('companyId') companyId?: string) {
    const settings = await this.settingsService.initializeDefaultSettings(companyId);
    return {
      success: true,
      message: 'Default settings initialized successfully',
      data: settings,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a setting by ID' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async findOne(@Param('id') id: string) {
    const setting = await this.settingsService.findOne(id);
    return {
      success: true,
      data: setting,
    };
  }

  @Get('module/:module/key/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a setting by module and key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  async findByModuleAndKey(
    @Param('module') module: string,
    @Param('key') key: string,
    @Query('companyId') companyId?: string,
  ) {
    const setting = await this.settingsService.findByModuleAndKey(
      module,
      key,
      companyId,
    );
    return {
      success: true,
      data: setting,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto) {
    const setting = await this.settingsService.update(id, updateSettingDto);
    return {
      success: true,
      message: 'Setting updated successfully',
      data: setting,
    };
  }

  @Post('upsert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a setting' })
  @ApiResponse({ status: 200, description: 'Setting upserted successfully' })
  async upsert(@Body() createSettingDto: CreateSettingDto) {
    const setting = await this.settingsService.upsert(createSettingDto);
    return {
      success: true,
      message: 'Setting saved successfully',
      data: setting,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a setting' })
  @ApiResponse({ status: 204, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async remove(@Param('id') id: string) {
    await this.settingsService.remove(id);
  }
}
