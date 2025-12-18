/*
  Warnings:

  - A unique constraint covering the columns `[boostId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BoostStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING_PAYMENT', 'CANCELLED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "boostId" TEXT;

-- CreateTable
CREATE TABLE "VisibilityBoost" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "BoostStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,
    "transactionId" TEXT,

    CONSTRAINT "VisibilityBoost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisibilityBoost_paymentId_key" ON "VisibilityBoost"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_boostId_key" ON "Payment"("boostId");

-- AddForeignKey
ALTER TABLE "VisibilityBoost" ADD CONSTRAINT "VisibilityBoost_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilityBoost" ADD CONSTRAINT "VisibilityBoost_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibilityBoost" ADD CONSTRAINT "VisibilityBoost_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
