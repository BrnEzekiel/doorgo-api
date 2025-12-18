-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('FAILED_LOGIN', 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_BLOCK', 'ACCOUNT_TAKEOVER', 'PASSWORD_RESET_ATTEMPT');

-- CreateTable
CREATE TABLE "SuspiciousActivityLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userId" TEXT,
    "activityType" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedByUserId" TEXT,

    CONSTRAINT "SuspiciousActivityLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SuspiciousActivityLog" ADD CONSTRAINT "SuspiciousActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousActivityLog" ADD CONSTRAINT "SuspiciousActivityLog_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
