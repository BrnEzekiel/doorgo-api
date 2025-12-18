/*
  Warnings:

  - A unique constraint covering the columns `[smsBundleId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SmsBundleStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING_PAYMENT', 'CANCELLED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "smsBundleId" TEXT;

-- CreateTable
CREATE TABLE "SmsBundle" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleName" TEXT NOT NULL,
    "smsCount" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "SmsBundleStatus" NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "paymentId" TEXT,
    "transactionId" TEXT,

    CONSTRAINT "SmsBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsBundle_paymentId_key" ON "SmsBundle"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_smsBundleId_key" ON "Payment"("smsBundleId");

-- AddForeignKey
ALTER TABLE "SmsBundle" ADD CONSTRAINT "SmsBundle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsBundle" ADD CONSTRAINT "SmsBundle_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
