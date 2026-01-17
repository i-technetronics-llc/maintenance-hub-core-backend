import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CustomerRegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;
}
