/*
  Warnings:

  - You are about to drop the column `studentId` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `isStudent` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `university` on the `User` table. All the data in the column will be lost.
  - Added the required column `tenantId` to the `ServiceBooking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServiceBooking" DROP CONSTRAINT "ServiceBooking_studentId_fkey";

-- AlterTable
ALTER TABLE "ServiceBooking" DROP COLUMN "studentId",
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isStudent",
DROP COLUMN "university",
ALTER COLUMN "role" SET DEFAULT ARRAY['tenant']::TEXT[];

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
