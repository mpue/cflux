-- Fehlende Module für Dashboard-Menüleiste anlegen
-- Diese Module werden in der AppNavbar verwendet

-- Travel Expenses Modul
INSERT INTO modules (id, key, name, description, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'travel_expenses',
  'Reisekosten',
  'Verwaltung von Reisekosten und Spesen',
  'MoneyIcon',
  true,
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Incidents Modul
INSERT INTO modules (id, key, name, description, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'incidents',
  'Incidents',
  'Incident Management und Meldungen',
  'WarningIcon',
  true,
  20,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- EHS Dashboard Modul
INSERT INTO modules (id, key, name, description, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'ehs',
  'EHS Dashboard',
  'Environment, Health & Safety KPI Dashboard',
  'HealthAndSafetyIcon',
  true,
  30,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Intranet Modul
INSERT INTO modules (id, key, name, description, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'intranet',
  'Intranet',
  'Intranet Dokumentenverwaltung',
  'MenuBookIcon',
  true,
  40,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Media Modul
INSERT INTO modules (id, key, name, description, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'media',
  'Medien',
  'Medienverwaltung und Downloads',
  'PermMediaIcon',
  true,
  50,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Workflow/Approvals Modul
INSERT INTO modules (id, key, name, description, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'workflow',
  'Genehmigungen',
  'Workflow und Genehmigungsprozesse',
  'NotificationsIcon',
  true,
  60,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Messages Modul
INSERT INTO modules (id, key, name, description, icon, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'messages',
  'Nachrichten',
  'Internes Nachrichtensystem',
  'MessageIcon',
  true,
  70,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Prüfe welche Module jetzt existieren
SELECT key, name, "isActive", "sortOrder" 
FROM modules 
ORDER BY "sortOrder";
