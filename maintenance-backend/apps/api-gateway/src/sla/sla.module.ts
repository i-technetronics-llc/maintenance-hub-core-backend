import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SLAService } from './sla.service';
import { SLAController } from './sla.controller';
import { SLA } from '@app/database/entities/sla.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SLA])],
  controllers: [SLAController],
  providers: [SLAService],
  exports: [SLAService],
})
export class SLAModule {}
