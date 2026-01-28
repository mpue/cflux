-- Migrate OvertimeBalance from userId to employeeId
-- Set employeeId based on userId where employeeId is NULL
UPDATE overtime_balances ob
SET "employeeId" = e.id
FROM employees e
WHERE ob."userId" = e."userId"
  AND ob."employeeId" IS NULL;

-- Check for any remaining NULL employeeIds
SELECT COUNT(*) as remaining_null_overtimebalances
FROM overtime_balances
WHERE "employeeId" IS NULL;

-- Migrate ComplianceViolation from userId to employeeId
-- Set employeeId based on userId where employeeId is NULL
UPDATE compliance_violations cv
SET "employeeId" = e.id
FROM employees e
WHERE cv."userId" = e."userId"
  AND cv."employeeId" IS NULL;

-- Check for any remaining NULL employeeIds
SELECT COUNT(*) as remaining_null_complianceviolations
FROM compliance_violations
WHERE "employeeId" IS NULL;

-- Final verification
SELECT 
    'overtime_balances' as table_name,
    COUNT(*) as total,
    COUNT("employeeId") as with_employee,
    COUNT(*) - COUNT("employeeId") as without_employee
FROM overtime_balances
UNION ALL
SELECT 
    'compliance_violations' as table_name,
    COUNT(*) as total,
    COUNT("employeeId") as with_employee,
    COUNT(*) - COUNT("employeeId") as without_employee
FROM compliance_violations;
