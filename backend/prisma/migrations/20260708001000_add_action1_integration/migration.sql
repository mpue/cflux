-- AlterTable
ALTER TABLE "device_software" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "action1EndpointId" TEXT;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "action1AutoSync" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "action1ClientId" TEXT,
ADD COLUMN     "action1ClientSecret" TEXT,
ADD COLUMN     "action1Enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "action1LastSyncAt" TIMESTAMP(3),
ADD COLUMN     "action1OrgId" TEXT,
ADD COLUMN     "action1Region" TEXT,
ADD COLUMN     "action1SyncInterval" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "action1SyncTime" TEXT NOT NULL DEFAULT '03:00';

-- CreateIndex
CREATE INDEX "device_software_deviceId_source_idx" ON "device_software"("deviceId", "source");

-- CreateIndex
CREATE INDEX "devices_action1EndpointId_idx" ON "devices"("action1EndpointId");

