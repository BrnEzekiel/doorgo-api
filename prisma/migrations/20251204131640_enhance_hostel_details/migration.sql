-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "extraChargesDescription" TEXT,
ADD COLUMN     "paymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "utilityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
