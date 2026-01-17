import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from '@app/database/entities/company.entity';
import { User } from '@app/database/entities/user.entity';
import { Role } from '@app/database/entities/role.entity';
import { OrganizationType } from '@app/database/entities/organization-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, Role, OrganizationType]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
