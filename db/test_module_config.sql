-- Erwartetes Verhalten:
-- 
-- Module OHNE module_access Einträge (öffentlich für alle):
--   - intranet, media, messages, travel_expenses, workflow
--   → Sollten für ALLE Benutzer sichtbar sein
--
-- Module MIT module_access Einträgen (eingeschränkt):
--   - ehs: Nur Gruppe "Lonza" (canView=true)
--   - incidents: Nur Gruppe "Lonza" (canView=true)
--   → Sollten NUR für lonza.baustelle@aquist.ch sichtbar sein
--
-- Test 1: Benutzer in Gruppe "Lonza" (lonza.baustelle@aquist.ch)
--   Sollte sehen: ehs, incidents, intranet, media, messages, travel_expenses, workflow
--
-- Test 2: Benutzer in Gruppe "User" (matthias@pueski.de)
--   Sollte sehen: intranet, media, messages, travel_expenses, workflow
--   Sollte NICHT sehen: ehs, incidents
--
-- Test 3: Benutzer ohne Gruppe (z.B. admin@timetracking.local)
--   Admin: Sollte ALLES sehen
--   Normaler User: Sollte nur öffentliche Module sehen

-- Zeige aktuelle Konfiguration:
SELECT 
  'Module mit Zugriffsbeschränkung:' as info;
  
SELECT 
  m.key, 
  m.name,
  ug.name as restricted_to_group,
  ma."canView"
FROM modules m 
INNER JOIN module_access ma ON m.id = ma."moduleId"
INNER JOIN user_groups ug ON ma."userGroupId" = ug.id
WHERE m.key IN ('ehs', 'incidents', 'intranet', 'media', 'workflow', 'messages', 'travel_expenses')
ORDER BY m.key;

SELECT 
  '' as separator;

SELECT 
  'Module OHNE Zugriffsbeschränkung (öffentlich):' as info;

SELECT 
  m.key,
  m.name
FROM modules m
LEFT JOIN module_access ma ON m.id = ma."moduleId"
WHERE m.key IN ('ehs', 'incidents', 'intranet', 'media', 'workflow', 'messages', 'travel_expenses')
  AND ma.id IS NULL
ORDER BY m.key;
