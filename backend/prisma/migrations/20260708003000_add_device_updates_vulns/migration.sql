-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "action1SyncUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "action1SyncVulnerabilities" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "action1VulnSeverity" TEXT NOT NULL DEFAULT 'Critical,High';

-- CreateTable
CREATE TABLE "device_updates" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "kb" TEXT,
    "severity" TEXT,
    "category" TEXT,
    "releaseDate" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_vulnerabilities" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "cveId" TEXT NOT NULL,
    "name" TEXT,
    "score" TEXT,
    "remediationStatus" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_vulnerabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_updates_deviceId_idx" ON "device_updates"("deviceId");

-- CreateIndex
CREATE INDEX "device_vulnerabilities_deviceId_idx" ON "device_vulnerabilities"("deviceId");

-- CreateIndex
CREATE INDEX "device_vulnerabilities_deviceId_cveId_idx" ON "device_vulnerabilities"("deviceId", "cveId");

-- AddForeignKey
ALTER TABLE "device_updates" ADD CONSTRAINT "device_updates_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_vulnerabilities" ADD CONSTRAINT "device_vulnerabilities_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

