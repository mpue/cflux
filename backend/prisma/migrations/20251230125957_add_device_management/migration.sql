-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "category" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyUntil" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_assignments" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "device_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_serialNumber_key" ON "devices"("serialNumber");

-- CreateIndex
CREATE INDEX "devices_userId_idx" ON "devices"("userId");

-- CreateIndex
CREATE INDEX "devices_serialNumber_idx" ON "devices"("serialNumber");

-- CreateIndex
CREATE INDEX "device_assignments_deviceId_idx" ON "device_assignments"("deviceId");

-- CreateIndex
CREATE INDEX "device_assignments_userId_idx" ON "device_assignments"("userId");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_assignments" ADD CONSTRAINT "device_assignments_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_assignments" ADD CONSTRAINT "device_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
