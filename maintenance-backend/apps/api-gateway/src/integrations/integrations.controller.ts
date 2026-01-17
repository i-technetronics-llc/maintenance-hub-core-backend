import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto, UpdateIntegrationDto, UpdateMappingsDto } from './dto';
import { JwtAuthGuard } from '@app/common/guards';
import { Public } from '@app/common/decorators';
import {
  IntegrationConfig,
  IntegrationType,
} from '@app/database/entities/integration-config.entity';
import { IntegrationLog, SyncDirection, SyncLogStatus } from '@app/database/entities/integration-log.entity';
import { QueueStatus } from '@app/database/entities/sync-queue.entity';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /**
   * Create a new integration configuration
   * POST /api/v1/integrations
   */
  @Post()
  async create(
    @Body() createDto: CreateIntegrationDto,
    @Request() req: any,
  ): Promise<IntegrationConfig> {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    return this.integrationsService.create(companyId, createDto, userId);
  }

  /**
   * Get all integrations for the current company
   * GET /api/v1/integrations
   */
  @Get()
  async findAll(@Request() req: any): Promise<IntegrationConfig[]> {
    const companyId = req.user?.companyId;
    return this.integrationsService.findAll(companyId);
  }

  /**
   * Get available integration types
   * GET /api/v1/integrations/types
   */
  @Get('types')
  getIntegrationTypes(): { value: string; label: string; description: string }[] {
    return [
      {
        value: IntegrationType.SAP,
        label: 'SAP',
        description: 'SAP ERP integration (MM, PM, CO modules)',
      },
      {
        value: IntegrationType.ORACLE,
        label: 'Oracle',
        description: 'Oracle EBS/Cloud integration (Inventory, Assets, Work Orders)',
      },
      {
        value: IntegrationType.DYNAMICS,
        label: 'Microsoft Dynamics',
        description: 'Microsoft Dynamics 365 integration (coming soon)',
      },
    ];
  }

  /**
   * Get pending sync queue items
   * GET /api/v1/integrations/queue
   */
  @Get('queue')
  async getQueue(
    @Request() req: any,
    @Query('integrationId') integrationId?: string,
    @Query('status') status?: QueueStatus,
    @Query('entityType') entityType?: string,
  ) {
    const companyId = req.user?.companyId;
    return this.integrationsService.getQueueItems(companyId, {
      integrationId,
      status,
      entityType,
    });
  }

  /**
   * Get default field mappings for an integration type
   * GET /api/v1/integrations/mappings/:type
   */
  @Get('mappings/:type')
  getDefaultMappings(@Param('type') type: IntegrationType): Record<string, Record<string, string>> {
    switch (type) {
      case IntegrationType.SAP:
        return require('./connectors/sap.connector').SAP_DEFAULT_MAPPINGS;
      case IntegrationType.ORACLE:
        return require('./connectors/oracle.connector').ORACLE_DEFAULT_MAPPINGS;
      default:
        return {};
    }
  }

  /**
   * Get integration by ID
   * GET /api/v1/integrations/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IntegrationConfig> {
    const companyId = req.user?.companyId;
    return this.integrationsService.findOne(id, companyId);
  }

  /**
   * Update integration configuration
   * PATCH /api/v1/integrations/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateIntegrationDto,
    @Request() req: any,
  ): Promise<IntegrationConfig> {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    return this.integrationsService.update(id, companyId, updateDto, userId);
  }

  /**
   * Delete integration configuration
   * DELETE /api/v1/integrations/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    return this.integrationsService.remove(id, companyId, userId);
  }

  /**
   * Test connection to ERP system
   * POST /api/v1/integrations/:id/test
   */
  @Post(':id/test')
  async testConnection(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId;
    return this.integrationsService.testConnection(id, companyId);
  }

  /**
   * Trigger manual sync
   * POST /api/v1/integrations/:id/sync
   */
  @Post(':id/sync')
  async triggerSync(
    @Param('id') id: string,
    @Request() req: any,
    @Body() options?: {
      syncAssets?: boolean;
      syncInventory?: boolean;
      syncWorkOrders?: boolean;
      syncPurchaseOrders?: boolean;
    },
  ) {
    const companyId = req.user?.companyId;
    return this.integrationsService.triggerSync(id, companyId, options);
  }

  /**
   * Update field mappings
   * POST /api/v1/integrations/:id/mappings
   */
  @Post(':id/mappings')
  async updateMappings(
    @Param('id') id: string,
    @Body() mappingsDto: UpdateMappingsDto,
    @Request() req: any,
  ): Promise<IntegrationConfig> {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    return this.integrationsService.updateMappings(id, companyId, mappingsDto, userId);
  }

  /**
   * Get sync logs for an integration
   * GET /api/v1/integrations/:id/logs
   */
  @Get(':id/logs')
  async getLogs(
    @Param('id') id: string,
    @Request() req: any,
    @Query('direction') direction?: SyncDirection,
    @Query('entityType') entityType?: string,
    @Query('status') status?: SyncLogStatus,
    @Query('limit') limit?: number,
  ): Promise<IntegrationLog[]> {
    const companyId = req.user?.companyId;
    return this.integrationsService.getLogs(id, companyId, {
      direction,
      entityType,
      status,
      limit: limit ? parseInt(limit as any) : undefined,
    });
  }
}
