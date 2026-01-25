-- Milestone 1: Employee Refactoring
-- This migration creates Employee records for all existing Users
-- and updates Time Tracking relations to use the new Employee model

-- ==========================================
-- PHASE 1: Extend Employee table with new fields
-- ==========================================

-- Add new fields to Employee table (if not exist)
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "mobile" VARCHAR;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "streetNumber" VARCHAR;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "placeOfBirth" VARCHAR;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "nationality" VARCHAR;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "civilStatus" VARCHAR;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "ahvNumber" VARCHAR UNIQUE;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "isCrossBorderCommuter" BOOLEAN DEFAULT false;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "employeeNumber" VARCHAR UNIQUE;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "entryDate" TIMESTAMP;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "exitDate" TIMESTAMP;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "weeklyHours" INTEGER DEFAULT 45;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "contractHours" DOUBLE PRECISION;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "hourlyRate" DOUBLE PRECISION;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "canton" VARCHAR DEFAULT 'ZH';
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "exemptFromTracking" BOOLEAN DEFAULT false;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "vacationDays" DOUBLE PRECISION DEFAULT 30;

-- Update country default for Switzerland
ALTER TABLE "employees" ALTER COLUMN "country" SET DEFAULT 'Schweiz';

-- ==========================================
-- PHASE 2: Create Employee records for existing Users
-- ==========================================

-- Insert Employee records for all Users that don't have one yet
INSERT INTO "employees" (
  id,
  "userId",
  "firstName",
  "lastName",
  email,
  phone,
  mobile,
  street,
  "streetNumber",
  city,
  "zipCode",
  "postalCode",
  country,
  "dateOfBirth",
  "placeOfBirth",
  nationality,
  "civilStatus",
  religion,
  "ahvNumber",
  "isCrossBorderCommuter",
  "employeeNumber",
  "entryDate",
  "exitDate",
  "weeklyHours",
  "contractHours",
  "hourlyRate",
  canton,
  "exemptFromTracking",
  "vacationDays",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid() as id,
  u.id as "userId",
  u."firstName",
  u."lastName",
  u.email,
  u.phone,
  u.mobile,
  u.street,
  u."streetNumber",
  u.city,
  u."zipCode",
  u."zipCode" as "postalCode",
  COALESCE(u.country, 'Schweiz') as country,
  u."dateOfBirth",
  u."placeOfBirth",
  u.nationality,
  u."civilStatus",
  u.religion,
  u."ahvNumber",
  COALESCE(u."isCrossBorderCommuter", false) as "isCrossBorderCommuter",
  u."employeeNumber",
  u."entryDate",
  u."exitDate",
  COALESCE(u."weeklyHours", 45) as "weeklyHours",
  u."contractHours",
  u."hourlyRate",
  COALESCE(u.canton, 'ZH') as canton,
  COALESCE(u."exemptFromTracking", false) as "exemptFromTracking",
  COALESCE(u."vacationDays", 30) as "vacationDays",
  u."isActive",
  u."createdAt",
  NOW() as "updatedAt"
FROM "users" u
WHERE u.role = 'USER'
  AND NOT EXISTS (
    SELECT 1 FROM "employees" e WHERE e."userId" = u.id
  );

-- ==========================================
-- PHASE 3: Add employeeId columns to related tables
-- ==========================================

-- TimeEntry
ALTER TABLE "time_entries" ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR;

-- AbsenceRequest
ALTER TABLE "absence_requests" ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR;

-- OvertimeBalance
ALTER TABLE "overtime_balances" ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR;

-- ComplianceViolation
ALTER TABLE "compliance_violations" ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR;

-- ProjectAssignment
ALTER TABLE "project_assignments" ADD COLUMN IF NOT EXISTS "employeeId" VARCHAR;

-- ==========================================
-- PHASE 4: Populate employeeId fields
-- ==========================================

-- Update TimeEntry with employeeId
UPDATE "time_entries" te
SET "employeeId" = e.id
FROM "employees" e
WHERE te."userId" = e."userId"
  AND te."employeeId" IS NULL;

-- Update AbsenceRequest with employeeId
UPDATE "absence_requests" ar
SET "employeeId" = e.id
FROM "employees" e
WHERE ar."userId" = e."userId"
  AND ar."employeeId" IS NULL;

-- Update OvertimeBalance with employeeId
UPDATE "overtime_balances" ob
SET "employeeId" = e.id
FROM "employees" e
WHERE ob."userId" = e."userId"
  AND ob."employeeId" IS NULL;

-- Update ComplianceViolation with employeeId
UPDATE "compliance_violations" cv
SET "employeeId" = e.id
FROM "employees" e
WHERE cv."userId" = e."userId"
  AND cv."employeeId" IS NULL;

-- Update ProjectAssignment with employeeId
UPDATE "project_assignments" pa
SET "employeeId" = e.id
FROM "employees" e
WHERE pa."userId" = e."userId"
  AND pa."employeeId" IS NULL;

-- ==========================================
-- PHASE 5: Create indexes and foreign keys
-- ==========================================

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS "employees_employeeNumber_idx" ON "employees"("employeeNumber");
CREATE INDEX IF NOT EXISTS "employees_ahvNumber_idx" ON "employees"("ahvNumber");
CREATE INDEX IF NOT EXISTS "employees_isActive_idx" ON "employees"("isActive");

-- Add indexes for new employeeId columns
CREATE INDEX IF NOT EXISTS "time_entries_employeeId_idx" ON "time_entries"("employeeId");
CREATE INDEX IF NOT EXISTS "absence_requests_employeeId_idx" ON "absence_requests"("employeeId");
CREATE INDEX IF NOT EXISTS "overtime_balances_employeeId_idx" ON "overtime_balances"("employeeId");
CREATE INDEX IF NOT EXISTS "compliance_violations_employeeId_idx" ON "compliance_violations"("employeeId");
CREATE INDEX IF NOT EXISTS "project_assignments_employeeId_idx" ON "project_assignments"("employeeId");

-- Add foreign key constraints (with ON DELETE SET NULL for soft migration)
ALTER TABLE "time_entries" 
  ADD CONSTRAINT IF NOT EXISTS "time_entries_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "employees"(id) ON DELETE SET NULL;

ALTER TABLE "absence_requests" 
  ADD CONSTRAINT IF NOT EXISTS "absence_requests_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "employees"(id) ON DELETE SET NULL;

ALTER TABLE "overtime_balances" 
  ADD CONSTRAINT IF NOT EXISTS "overtime_balances_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "employees"(id) ON DELETE SET NULL;

ALTER TABLE "compliance_violations" 
  ADD CONSTRAINT IF NOT EXISTS "compliance_violations_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "employees"(id) ON DELETE SET NULL;

ALTER TABLE "project_assignments" 
  ADD CONSTRAINT IF NOT EXISTS "project_assignments_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "employees"(id) ON DELETE SET NULL;

-- ==========================================
-- PHASE 6: Verification Queries
-- ==========================================

-- Count Users without Employee record
DO $$
DECLARE
  users_without_employee INTEGER;
  total_users INTEGER;
  total_employees INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_without_employee 
  FROM "users" u 
  WHERE u.role = 'USER' 
    AND NOT EXISTS (SELECT 1 FROM "employees" e WHERE e."userId" = u.id);
    
  SELECT COUNT(*) INTO total_users FROM "users" WHERE role = 'USER';
  SELECT COUNT(*) INTO total_employees FROM "employees" WHERE "userId" IS NOT NULL;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'MIGRATION VERIFICATION';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total Users (role=USER): %', total_users;
  RAISE NOTICE 'Total Employees with userId: %', total_employees;
  RAISE NOTICE 'Users without Employee record: %', users_without_employee;
  
  IF users_without_employee > 0 THEN
    RAISE WARNING 'Some users do not have Employee records!';
  ELSE
    RAISE NOTICE 'All users have Employee records ✓';
  END IF;
END $$;

-- Count TimeEntries without employeeId
DO $$
DECLARE
  entries_without_employee INTEGER;
  total_entries INTEGER;
BEGIN
  SELECT COUNT(*) INTO entries_without_employee FROM "time_entries" WHERE "employeeId" IS NULL;
  SELECT COUNT(*) INTO total_entries FROM "time_entries";
  
  RAISE NOTICE 'TimeEntries without employeeId: % of %', entries_without_employee, total_entries;
  
  IF entries_without_employee > 0 THEN
    RAISE WARNING 'Some time entries do not have employeeId!';
  END IF;
END $$;

-- ==========================================
-- NOTES FOR FUTURE PHASES
-- ==========================================

-- IMPORTANT: This migration keeps both userId and employeeId for compatibility
-- In a future phase (Milestone 1 Phase 2), we can:
-- 1. Make employeeId NOT NULL
-- 2. Remove userId foreign keys (keep column for reference)
-- 3. Update all backend code to use employee relations
-- 4. Test extensively
-- 5. Finally drop userId columns after confirmation

-- For now, both work in parallel!
