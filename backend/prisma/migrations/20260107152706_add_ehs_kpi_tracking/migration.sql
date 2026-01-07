/*
  Warnings:

  - You are about to drop the `document_node_attachment_versions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_node_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_deliveries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_delivery_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EHSCategory" AS ENUM ('UNSAFE_CONDITION', 'UNSAFE_BEHAVIOR', 'NEAR_MISS', 'FIRST_AID', 'RECORDABLE', 'LTI', 'FATALITY', 'PROPERTY_DAMAGE', 'ENVIRONMENT', 'SAFETY_OBSERVATION');

-- CreateEnum
CREATE TYPE "EHSSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- DropForeignKey
ALTER TABLE "document_node_attachment_versions" DROP CONSTRAINT "document_node_attachment_versions_attachmentId_fkey";

-- DropForeignKey
ALTER TABLE "document_node_attachment_versions" DROP CONSTRAINT "document_node_attachment_versions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "document_node_attachments" DROP CONSTRAINT "document_node_attachments_createdById_fkey";

-- DropForeignKey
ALTER TABLE "document_node_attachments" DROP CONSTRAINT "document_node_attachments_documentNodeId_fkey";

-- DropForeignKey
ALTER TABLE "document_node_attachments" DROP CONSTRAINT "document_node_attachments_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "order_deliveries" DROP CONSTRAINT "order_deliveries_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_deliveries" DROP CONSTRAINT "order_deliveries_receivedById_fkey";

-- DropForeignKey
ALTER TABLE "order_delivery_items" DROP CONSTRAINT "order_delivery_items_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_articleId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_projectId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_rejectedById_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_supplierId_fkey";

-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "correctiveActions" TEXT,
ADD COLUMN     "ehsCategory" "EHSCategory",
ADD COLUMN     "ehsSeverity" "EHSSeverity",
ADD COLUMN     "hospitalRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hoursWorkedDay" DOUBLE PRECISION,
ADD COLUMN     "incidentDate" TIMESTAMP(3),
ADD COLUMN     "isEHSRelevant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "lostWorkDays" INTEGER,
ADD COLUMN     "medicalTreatment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preventiveActions" TEXT,
ADD COLUMN     "workersOnDay" INTEGER;

-- DropTable
DROP TABLE "document_node_attachment_versions";

-- DropTable
DROP TABLE "document_node_attachments";

-- DropTable
DROP TABLE "order_deliveries";

-- DropTable
DROP TABLE "order_delivery_items";

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "orders";

-- DropEnum
DROP TYPE "OrderPriority";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "ehs_monthly_data" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "projectId" TEXT,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "workersPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unsafeConditions" INTEGER NOT NULL DEFAULT 0,
    "unsafeBehaviors" INTEGER NOT NULL DEFAULT 0,
    "nearMisses" INTEGER NOT NULL DEFAULT 0,
    "firstAids" INTEGER NOT NULL DEFAULT 0,
    "recordables" INTEGER NOT NULL DEFAULT 0,
    "ltis" INTEGER NOT NULL DEFAULT 0,
    "fatalities" INTEGER NOT NULL DEFAULT 0,
    "propertyDamages" INTEGER NOT NULL DEFAULT 0,
    "environmentIncidents" INTEGER NOT NULL DEFAULT 0,
    "safetyObservations" INTEGER NOT NULL DEFAULT 0,
    "ltifr" DOUBLE PRECISION,
    "trir" DOUBLE PRECISION,
    "highlights" TEXT,
    "achievements" TEXT,
    "hotTopics" TEXT,
    "safetyAward" TEXT,
    "closingRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ehs_monthly_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ehs_monthly_data_year_month_idx" ON "ehs_monthly_data"("year", "month");

-- CreateIndex
CREATE INDEX "ehs_monthly_data_projectId_idx" ON "ehs_monthly_data"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ehs_monthly_data_year_month_projectId_key" ON "ehs_monthly_data"("year", "month", "projectId");

-- CreateIndex
CREATE INDEX "incidents_ehsCategory_idx" ON "incidents"("ehsCategory");

-- CreateIndex
CREATE INDEX "incidents_isEHSRelevant_idx" ON "incidents"("isEHSRelevant");

-- CreateIndex
CREATE INDEX "incidents_incidentDate_idx" ON "incidents"("incidentDate");

-- AddForeignKey
ALTER TABLE "ehs_monthly_data" ADD CONSTRAINT "ehs_monthly_data_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
