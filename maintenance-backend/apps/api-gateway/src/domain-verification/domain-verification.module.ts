import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DomainVerificationController } from './domain-verification.controller';
import { DomainVerificationService } from './domain-verification.service';
import { DomainVerificationJob } from './domain-verification.job';
import { DomainVerification } from '@app/database/entities/domain-verification.entity';
import { Company } from '@app/database/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DomainVerification, Company]),
    ScheduleModule.forRoot(),
  ],
  controllers: [DomainVerificationController],
  providers: [DomainVerificationService, DomainVerificationJob],
  exports: [DomainVerificationService],
})
export class DomainVerificationModule {}
