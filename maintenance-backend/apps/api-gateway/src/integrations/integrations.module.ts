import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationConfig } from '@app/database/entities/integration-config.entity';
import { IntegrationLog } from '@app/database/entities/integration-log.entity';
import { SyncQueue } from '@app/database/entities/sync-queue.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { Inventory } from '@app/database/entities/inventory.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntegrationConfig,
      IntegrationLog,
      SyncQueue,
      Asset,
      Inventory,
      WorkOrder,
    ]),
    ScheduleModule.forRoot(),
    AuditModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
