-- CreateEnum
CREATE TYPE "HandoverProtocolType" AS ENUM ('HANDOVER', 'RETURN');

-- CreateEnum
CREATE TYPE "HandoverProtocolStatus" AS ENUM ('DRAFT', 'SIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HandoverItemKind" AS ENUM ('DEVICE', 'TOOL', 'EQUIPMENT', 'OTHER');

-- AlterTable
ALTER TABLE "device_assignments" ADD COLUMN     "handoverProtocolId" TEXT,
ADD COLUMN     "returnProtocolId" TEXT;

-- CreateTable
CREATE TABLE "handover_protocols" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "type" "HandoverProtocolType" NOT NULL DEFAULT 'HANDOVER',
    "status" "HandoverProtocolStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT,
    "employeeId" TEXT,
    "handoverDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "notes" TEXT,
    "issuedById" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "signatureRecipientPath" TEXT,
    "signatureIssuerPath" TEXT,
    "signedDocumentPath" TEXT,
    "pdfPath" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handover_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_protocol_items" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "kind" "HandoverItemKind" NOT NULL DEFAULT 'DEVICE',
    "deviceId" TEXT,
    "toolId" TEXT,
    "equipmentId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "serialNumber" TEXT,
    "inventoryNumber" TEXT,
    "condition" "EquipmentCondition" NOT NULL DEFAULT 'GOOD',
    "accessories" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handover_protocol_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "handover_protocols_protocolNumber_key" ON "handover_protocols"("protocolNumber");

-- CreateIndex
CREATE INDEX "handover_protocols_userId_idx" ON "handover_protocols"("userId");

-- CreateIndex
CREATE INDEX "handover_protocols_employeeId_idx" ON "handover_protocols"("employeeId");

-- CreateIndex
CREATE INDEX "handover_protocols_issuedById_idx" ON "handover_protocols"("issuedById");

-- CreateIndex
CREATE INDEX "handover_protocols_status_idx" ON "handover_protocols"("status");

-- CreateIndex
CREATE INDEX "handover_protocols_handoverDate_idx" ON "handover_protocols"("handoverDate");

-- CreateIndex
CREATE INDEX "handover_protocol_items_protocolId_idx" ON "handover_protocol_items"("protocolId");

-- CreateIndex
CREATE INDEX "handover_protocol_items_deviceId_idx" ON "handover_protocol_items"("deviceId");

-- CreateIndex
CREATE INDEX "handover_protocol_items_toolId_idx" ON "handover_protocol_items"("toolId");

-- CreateIndex
CREATE INDEX "handover_protocol_items_equipmentId_idx" ON "handover_protocol_items"("equipmentId");

-- CreateIndex
CREATE INDEX "device_assignments_handoverProtocolId_idx" ON "device_assignments"("handoverProtocolId");

-- CreateIndex
CREATE INDEX "device_assignments_returnProtocolId_idx" ON "device_assignments"("returnProtocolId");

-- AddForeignKey
ALTER TABLE "device_assignments" ADD CONSTRAINT "device_assignments_handoverProtocolId_fkey" FOREIGN KEY ("handoverProtocolId") REFERENCES "handover_protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_assignments" ADD CONSTRAINT "device_assignments_returnProtocolId_fkey" FOREIGN KEY ("returnProtocolId") REFERENCES "handover_protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocols" ADD CONSTRAINT "handover_protocols_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocols" ADD CONSTRAINT "handover_protocols_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocols" ADD CONSTRAINT "handover_protocols_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocol_items" ADD CONSTRAINT "handover_protocol_items_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "handover_protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocol_items" ADD CONSTRAINT "handover_protocol_items_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocol_items" ADD CONSTRAINT "handover_protocol_items_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocol_items" ADD CONSTRAINT "handover_protocol_items_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

