import { IsNotEmpty, IsString } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
