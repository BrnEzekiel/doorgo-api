/*
  Warnings:

  - A unique constraint covering the columns `[caretakerId]` on the table `Hostel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "caretakerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_caretakerId_key" ON "Hostel"("caretakerId");

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
