import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailValidationMode } from '@app/common/enums';

export class UpdateEmailValidationModeDto {
  @ApiProperty({
    example: 'strict',
    description: 'Email validation mode (strict requires domain verification)',
    enum: EmailValidationMode,
  })
  @IsEnum(EmailValidationMode)
  @IsNotEmpty()
  emailValidationMode: EmailValidationMode;
}
