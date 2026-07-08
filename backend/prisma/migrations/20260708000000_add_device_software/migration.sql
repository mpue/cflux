-- CreateTable
CREATE TABLE "device_software" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "vendor" TEXT,
    "version" TEXT,
    "licenseKey" TEXT,
    "licenseType" TEXT,
    "seats" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_software_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_software_deviceId_idx" ON "device_software"("deviceId");

-- AddForeignKey
ALTER TABLE "device_software" ADD CONSTRAINT "device_software_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

