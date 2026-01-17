import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class CustomerResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  newPassword: string;
}
