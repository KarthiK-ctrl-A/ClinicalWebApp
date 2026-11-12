import {
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  @Matches(/\S/, {
    message: 'Message cannot be empty',
  })
  @MaxLength(2000)
  content: string;
}