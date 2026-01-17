import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  WorkOrder,
  Asset,
  Inventory,
  User,
  Role,
  Company,
} from '@app/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkOrder,
      Asset,
      Inventory,
      User,
      Role,
      Company,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
