import { IsString, IsBoolean, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@app/common/enums';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name (e.g., SUPER_ADMIN, MANAGER)',
    example: UserRole.MAINTENANCE_MANAGER,
    enum: UserRole,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  name: UserRole;

  @ApiProperty({
    description: 'Whether this is a system role (available across all companies)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystemRole?: boolean;
}
