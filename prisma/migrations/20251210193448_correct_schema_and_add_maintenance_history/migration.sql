-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "assignedProviderId" TEXT;

-- CreateTable
CREATE TABLE "MaintenanceStatusHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maintenanceRequestId" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,

    CONSTRAINT "MaintenanceStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceStatusHistory" ADD CONSTRAINT "MaintenanceStatusHistory_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceStatusHistory" ADD CONSTRAINT "MaintenanceStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
