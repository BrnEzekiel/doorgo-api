import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateBookingRoomDto {
  @IsString()
  @IsNotEmpty()
  newRoomId: string;
}