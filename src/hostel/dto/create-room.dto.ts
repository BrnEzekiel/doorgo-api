export class CreateRoomDto {
  roomNumber: string;
  monthlyRent: number;
  semesterRent?: number;
  depositAmount?: number;
  maxOccupants: number;
  amenities: string[];
  roomType: string;
  hostelId: string;
}
