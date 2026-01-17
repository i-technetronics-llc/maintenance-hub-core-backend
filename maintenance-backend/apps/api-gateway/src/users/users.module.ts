import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '@app/database/entities/user.entity';
import { Company } from '@app/database/entities/company.entity';
import { Role } from '@app/database/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company, Role])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
