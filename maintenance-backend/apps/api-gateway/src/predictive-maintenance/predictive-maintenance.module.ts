import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PredictionModel } from '@app/database/entities/prediction-model.entity';
import { AssetPrediction } from '@app/database/entities/asset-prediction.entity';
import { SensorData } from '@app/database/entities/sensor-data.entity';
import { Asset } from '@app/database/entities/asset.entity';
import { WorkOrder } from '@app/database/entities/work-order.entity';
import { PredictiveMaintenanceService } from './predictive-maintenance.service';
import { PredictiveMaintenanceController } from './predictive-maintenance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PredictionModel,
      AssetPrediction,
      SensorData,
      Asset,
      WorkOrder,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [PredictiveMaintenanceController],
  providers: [PredictiveMaintenanceService],
  exports: [PredictiveMaintenanceService],
})
export class PredictiveMaintenanceModule {}
