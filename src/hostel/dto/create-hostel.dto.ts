export class CreateHostelDto {
  name: string;
  nearbyLandmark: string;
  propertyType: string;
  images?: string[];
  description?: string;
  amenities?: string[];
  utilityTypes?: string[];
  paymentMethods?: string[];
  extraChargesDescription?: string;
}
