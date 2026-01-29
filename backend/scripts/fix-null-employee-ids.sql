-- Fix NULL employeeId values before schema migration

-- Option 1: Delete records with NULL employeeId (if they are test data)
-- DELETE FROM time_entries WHERE "employeeId" IS NULL;
-- DELETE FROM compliance_violations WHERE "employeeId" IS NULL;
-- DELETE FROM overtime_balances WHERE "employeeId" IS NULL;

-- Option 2: Set to a dummy/system user (safer)
-- First, find a valid user ID:
SELECT id, email, "firstName", "lastName" FROM users LIMIT 1;

-- Then update with that user ID (replace 'YOUR_USER_ID' with actual ID from above):
-- UPDATE time_entries SET "employeeId" = 'YOUR_USER_ID' WHERE "employeeId" IS NULL;
-- UPDATE compliance_violations SET "employeeId" = 'YOUR_USER_ID' WHERE "employeeId" IS NULL;
-- UPDATE overtime_balances SET "employeeId" = 'YOUR_USER_ID' WHERE "employeeId" IS NULL;

-- Check current NULL values:
SELECT 'time_entries' as table_name, COUNT(*) as null_count FROM time_entries WHERE "employeeId" IS NULL
UNION ALL
SELECT 'compliance_violations', COUNT(*) FROM compliance_violations WHERE "employeeId" IS NULL
UNION ALL
SELECT 'overtime_balances', COUNT(*) FROM overtime_balances WHERE "employeeId" IS NULL;
