import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  InventoryLocation,
  Manufacturer,
  Supplier,
  InventoryCategory,
} from '@app/database';
import { InventoryMasterController } from './inventory-master.controller';
import { InventoryMasterService } from './inventory-master.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryLocation,
      Manufacturer,
      Supplier,
      InventoryCategory,
    ]),
  ],
  controllers: [InventoryMasterController],
  providers: [InventoryMasterService],
  exports: [InventoryMasterService],
})
export class InventoryMasterModule {}
