import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PermissionModule, PermissionAction } from '@app/common/enums';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'companies:view',
    description: 'Unique permission code (module:action format)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'companies',
    description: 'Permission module',
    enum: PermissionModule,
  })
  @IsEnum(PermissionModule)
  @IsNotEmpty()
  module: PermissionModule;

  @ApiProperty({
    example: 'view',
    description: 'Permission action',
    enum: PermissionAction,
  })
  @IsEnum(PermissionAction)
  @IsNotEmpty()
  action: PermissionAction;

  @ApiProperty({
    example: 'View company information',
    description: 'Permission description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: true,
    description: 'Whether the permission is active',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
