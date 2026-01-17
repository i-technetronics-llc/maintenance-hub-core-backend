import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission } from '@app/database/entities/permission.entity';
import { RolePermission } from '@app/database/entities/role-permission.entity';
import { Role } from '@app/database/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, RolePermission, Role]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
