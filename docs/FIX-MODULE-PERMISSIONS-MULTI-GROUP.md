# Fix: Module-Berechtigungen für Benutzer mit mehreren Gruppen

## Problem
Benutzer, die in Benutzergruppen mit erweiterten Modulberechtigungen waren (z.B. "Manager"), bekamen trotzdem nur die Module der Basisgruppe "Benutzer" angezeigt.

## Ursache
Das System wurde auf Multiple-Group-Support umgestellt (ein Benutzer kann in mehreren Gruppen sein). Die Module-Service-Funktionen verwendeten jedoch noch das alte `user.userGroup`-Feld statt der neuen `user.userGroupMemberships`-Relation.

## Lösung
**Geänderte Dateien:**
- `backend/src/services/module.service.ts`

**Änderungen:**

### 1. `getModulesForUser()` aktualisiert
- Verwendet jetzt `userGroupMemberships` statt `userGroup`
- Durchläuft ALLE Gruppen eines Benutzers
- Sammelt Module aus ALLEN aktiven Gruppen
- Merged Berechtigungen (verwendet die permissivsten Rechte, wenn ein Modul in mehreren Gruppen vorhanden ist)

### 2. `checkUserModuleAccess()` aktualisiert
- Verwendet jetzt `userGroupMemberships` statt `userGroup`  
- Durchsucht ALLE Gruppen eines Benutzers
- Gibt `true` zurück, sobald in IRGENDEINER Gruppe die erforderliche Berechtigung gefunden wird

## Verhalten
- Ein Benutzer in mehreren Gruppen erhält die **vereinigte Menge** aller Module aus allen Gruppen
- Wenn ein Modul in mehreren Gruppen mit unterschiedlichen Berechtigungen vorhanden ist, werden die **permissivsten** Berechtigungen verwendet
- Beispiel: 
  - Gruppe A: Modul X mit canEdit=true, canDelete=false
  - Gruppe B: Modul X mit canEdit=false, canDelete=true
  - Resultat: Modul X mit canEdit=true, canDelete=true

## Deployment
Nach dem Update müssen Benutzer sich neu anmelden, damit das Frontend die aktualisierten Module lädt.

## Test
```sql
-- Gruppenzugehörigkeit eines Benutzers prüfen
SELECT u.email, ug.name as group_name
FROM users u 
JOIN user_group_memberships ugm ON u.id = ugm."userId" 
JOIN user_groups ug ON ugm."userGroupId" = ug.id 
WHERE u.email = 'markus.richter@example.com';

-- Module eines Benutzers prüfen (simuliert getModulesForUser)
SELECT DISTINCT m.name, m.key
FROM users u
JOIN user_group_memberships ugm ON u.id = ugm."userId"
JOIN user_groups ug ON ugm."userGroupId" = ug.id
JOIN module_access ma ON ug.id = ma."userGroupId"
JOIN modules m ON ma."moduleId" = m.id
WHERE u.email = 'markus.richter@example.com'
  AND ug."isActive" = true
  AND m."isActive" = true
  AND ma."canView" = true
ORDER BY m."sortOrder", m.name;
```

## Datum
2025-12-30
