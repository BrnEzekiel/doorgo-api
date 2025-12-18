import { IsNumber } from 'class-validator';

export class LandlordAnalyticsDto {
  @IsNumber()
  totalHostels: number;

  @IsNumber()
  totalRooms: number;

  @IsNumber()
  occupiedRooms: number;

  @IsNumber()
  occupancyRate: number;

  @IsNumber()
  totalRentExpected: number;

  @IsNumber()
  totalRentCollected: number;

  @IsNumber()
  totalRentOverdue: number;

  @IsNumber()
  rentCollectionRate: number;
}
