-- CreateTable
CREATE TABLE "RentStatus" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Due',
    "lastPaymentDate" TIMESTAMP(3),

    CONSTRAINT "RentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentPayment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rentStatusId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,

    CONSTRAINT "RentPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RentStatus" ADD CONSTRAINT "RentStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentStatus" ADD CONSTRAINT "RentStatus_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_rentStatusId_fkey" FOREIGN KEY ("rentStatusId") REFERENCES "RentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
