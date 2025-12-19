/*
  Warnings:

  - You are about to drop the column `university` on the `Hostel` table. All the data in the column will be lost.
  - Added the required column `nearbyLandmark` to the `Hostel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hostel" DROP COLUMN "university",
ADD COLUMN     "nearbyLandmark" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "VisibilityBoost" ADD CONSTRAINT "VisibilityBoost_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
