import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SavedReport } from '@app/database/entities/saved-report.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { Inventory } from '@app/database/entities/inventory.entity';
import { PMSchedule } from '@app/database/entities/pm-schedule.entity';
import { User } from '@app/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SavedReport,
      WorkOrder,
      Asset,
      Inventory,
      PMSchedule,
      User,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
