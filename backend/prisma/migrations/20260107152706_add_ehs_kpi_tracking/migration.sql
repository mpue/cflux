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

-- AlterTable
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "correctiveActions" TEXT,
ADD COLUMN IF NOT EXISTS "ehsCategory" "EHSCategory",
ADD COLUMN IF NOT EXISTS "ehsSeverity" "EHSSeverity",
ADD COLUMN IF NOT EXISTS "hospitalRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "hoursWorkedDay" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "incidentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isEHSRelevant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "lostWorkDays" INTEGER,
ADD COLUMN IF NOT EXISTS "medicalTreatment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "preventiveActions" TEXT,
ADD COLUMN IF NOT EXISTS "workersOnDay" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ehs_monthly_data" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "projectId" TEXT,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "workersPerDay" INTEGER NOT NULL DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS "Incident_ehsCategory_idx" ON "incidents"("ehsCategory");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Incident_isEHSRelevant_idx" ON "incidents"("isEHSRelevant");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Incident_incidentDate_idx" ON "incidents"("incidentDate");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ehs_monthly_data_year_month_projectId_key" ON "ehs_monthly_data"("year", "month", "projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ehs_monthly_data_year_idx" ON "ehs_monthly_data"("year");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ehs_monthly_data_projectId_idx" ON "ehs_monthly_data"("projectId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ehs_monthly_data_projectId_fkey'
    ) THEN
        ALTER TABLE "ehs_monthly_data" ADD CONSTRAINT "ehs_monthly_data_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

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
