import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteEmployeeDto {
  @ApiProperty({
    example: 'john.doe@acmecorp.com',
    description: 'Employee work email (must match company domain in STRICT mode)',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'Employee first name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Employee last name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Role ID to assign to the employee',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    example: '+1-555-0123',
    description: 'Employee phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
