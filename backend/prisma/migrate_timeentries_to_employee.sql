-- Migration: TimeEntry von userId zu employeeId
-- Datum: 2026-01-28
-- Beschreibung: Migriert alle TimeEntry Einträge vom User zum Employee Model

-- Schritt 1: Für alle TimeEntries mit userId, setze employeeId basierend auf User.employeeProfile
UPDATE time_entries te
SET "employeeId" = e.id
FROM users u
JOIN employees e ON e."userId" = u.id
WHERE te."userId" = u.id
  AND te."employeeId" IS NULL;

-- Schritt 2: Für ComplianceViolations
UPDATE compliance_violations cv
SET "employeeId" = e.id
FROM users u
JOIN employees e ON e."userId" = u.id
WHERE cv."userId" = u.id
  AND cv."employeeId" IS NULL;

-- Schritt 3: Für OvertimeBalances  
UPDATE overtime_balances ob
SET "employeeId" = e.id
FROM users u
JOIN employees e ON e."userId" = u.id
WHERE ob."userId" = u.id
  AND ob."employeeId" IS NULL;

-- Schritt 4: Prüfe wie viele TimeEntries noch kein employeeId haben
SELECT COUNT(*) as timeentries_without_employee 
FROM time_entries 
WHERE "employeeId" IS NULL;

-- Schritt 5: Prüfe Benutzer ohne Employee Profile
SELECT u.id, u.email, u."firstName", u."lastName"
FROM users u
LEFT JOIN employees e ON e."userId" = u.id
WHERE e.id IS NULL
  AND EXISTS (SELECT 1 FROM time_entries WHERE "userId" = u.id);
