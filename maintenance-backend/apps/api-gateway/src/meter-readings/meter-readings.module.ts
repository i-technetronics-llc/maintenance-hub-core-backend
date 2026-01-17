import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterReading } from '@app/database/entities/meter-reading.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { PMSchedule } from '@app/database/entities/pm-schedule.entity';
import { MeterReadingsService } from './meter-readings.service';
import { MeterReadingsController } from './meter-readings.controller';
import { PreventiveMaintenanceModule } from '../preventive-maintenance/preventive-maintenance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeterReading, Asset, PMSchedule]),
    forwardRef(() => PreventiveMaintenanceModule),
  ],
  controllers: [MeterReadingsController],
  providers: [MeterReadingsService],
  exports: [MeterReadingsService],
})
export class MeterReadingsModule {}
