-- Add EHS enums
CREATE TYPE "EHSCategory" AS ENUM ('UNSAFE_CONDITION', 'UNSAFE_BEHAVIOR', 'NEAR_MISS', 'FIRST_AID', 'RECORDABLE', 'LTI', 'FATALITY', 'PROPERTY_DAMAGE', 'ENVIRONMENT', 'SAFETY_OBSERVATION');
CREATE TYPE "EHSSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Add EHS fields to incidents
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "correctiveActions" TEXT;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "ehsCategory" "EHSCategory";
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "ehsSeverity" "EHSSeverity";
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "hospitalRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "hoursWorkedDay" DOUBLE PRECISION;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "incidentDate" TIMESTAMP(3);
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "isEHSRelevant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "lostWorkDays" INTEGER;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "medicalTreatment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "preventiveActions" TEXT;
ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "workersOnDay" INTEGER;

-- Create EHS monthly data table
CREATE TABLE IF NOT EXISTS "ehs_monthly_data" (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "ehs_monthly_data_year_month_idx" ON "ehs_monthly_data"("year", "month");
CREATE INDEX IF NOT EXISTS "ehs_monthly_data_projectId_idx" ON "ehs_monthly_data"("projectId");
CREATE UNIQUE INDEX IF NOT EXISTS "ehs_monthly_data_year_month_projectId_key" ON "ehs_monthly_data"("year", "month", "projectId");
CREATE INDEX IF NOT EXISTS "incidents_ehsCategory_idx" ON "incidents"("ehsCategory");
CREATE INDEX IF NOT EXISTS "incidents_isEHSRelevant_idx" ON "incidents"("isEHSRelevant");
CREATE INDEX IF NOT EXISTS "incidents_incidentDate_idx" ON "incidents"("incidentDate");

-- Add foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ehs_monthly_data_projectId_fkey'
    ) THEN
        ALTER TABLE "ehs_monthly_data" ADD CONSTRAINT "ehs_monthly_data_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
