-- Erstelle Employee Profile für alle User die noch keine haben aber TimeEntries haben

INSERT INTO employees (
  id, "userId", "firstName", "lastName", email, 
  "weeklyHours", "vacationDays", "isActive", 
  "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid() as id,
  u.id as "userId",
  u."firstName",
  u."lastName",
  u.email,
  45 as "weeklyHours",  -- Standard: 45h/Woche
  30 as "vacationDays",  -- Standard: 30 Tage
  u."isActive",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM employees e WHERE e."userId" = u.id
)
AND EXISTS (
  SELECT 1 FROM time_entries te WHERE te."userId" = u.id
);

-- Jetzt migriere die TimeEntries
UPDATE time_entries te
SET "employeeId" = e.id
FROM users u
JOIN employees e ON e."userId" = u.id
WHERE te."userId" = u.id
  AND te."employeeId" IS NULL;

-- Migriere ComplianceViolations
UPDATE compliance_violations cv
SET "employeeId" = e.id
FROM users u
JOIN employees e ON e."userId" = u.id
WHERE cv."userId" = u.id
  AND cv."employeeId" IS NULL;

-- Migriere OvertimeBalances
UPDATE overtime_balances ob
SET "employeeId" = e.id
FROM users u
JOIN employees e ON e."userId" = u.id
WHERE ob."userId" = u.id
  AND ob."employeeId" IS NULL;

-- Pr\u00fcfung
SELECT 
  COUNT(*) FILTER (WHERE "employeeId" IS NULL) as timeentries_without_employee,
  COUNT(*) FILTER (WHERE "employeeId" IS NOT NULL) as timeentries_with_employee,
  COUNT(*) as total_timeentries
FROM time_entries;
