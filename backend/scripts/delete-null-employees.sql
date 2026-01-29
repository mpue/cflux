DELETE FROM time_entries WHERE "employeeId" IS NULL;
DELETE FROM compliance_violations WHERE "employeeId" IS NULL;
DELETE FROM overtime_balances WHERE "employeeId" IS NULL;
