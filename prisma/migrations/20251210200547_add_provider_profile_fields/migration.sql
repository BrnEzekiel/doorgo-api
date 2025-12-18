-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "portfolioImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profilePictureUrl" TEXT;
