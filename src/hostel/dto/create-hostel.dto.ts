export class CreateHostelDto {
  name: string;
  university: string;
  propertyType: string;
  ownerId: string;
  images?: string[];
  description?: string;
  amenities?: string[];
  utilityTypes?: string[];
  paymentMethods?: string[];
  extraChargesDescription?: string;
}
