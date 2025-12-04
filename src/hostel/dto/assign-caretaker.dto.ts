import { IsString } from 'class-validator';

export class AssignCaretakerDto {
  @IsString()
  caretakerId: string;
}
