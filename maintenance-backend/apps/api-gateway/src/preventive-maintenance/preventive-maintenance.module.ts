import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PMSchedule } from '@app/database/entities/pm-schedule.entity';
import { PMTask } from '@app/database/entities/pm-task.entity';
import { PMExecutionHistory } from '@app/database/entities/pm-execution-history.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { MeterReading } from '@app/database/entities/meter-reading.entity';
import { PreventiveMaintenanceService } from './preventive-maintenance.service';
import { PreventiveMaintenanceController } from './preventive-maintenance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PMSchedule,
      PMTask,
      PMExecutionHistory,
      WorkOrder,
      Asset,
      MeterReading,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [PreventiveMaintenanceController],
  providers: [PreventiveMaintenanceService],
  exports: [PreventiveMaintenanceService],
})
export class PreventiveMaintenanceModule {}
