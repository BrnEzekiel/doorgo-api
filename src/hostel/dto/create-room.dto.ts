export class CreateRoomDto {
  roomNumber: string;
  monthlyRent: number;
  semesterRent?: number;
  maxOccupants: number;
  amenities: string[];
  hostelId: string;
}
