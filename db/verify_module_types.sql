-- Finale Überprüfung: Was sollte die User-Gruppe sehen?
-- PUBLIC Module (keine Einträge in module_access für IRGENDEINE Gruppe)
SELECT 
    m.key,
    m.name,
    'PUBLIC' as module_type,
    COUNT(ma.id) as access_entries
FROM modules m
LEFT JOIN module_access ma ON m.id = ma."moduleId"
WHERE m."isActive" = true
GROUP BY m.id, m.key, m.name
HAVING COUNT(ma.id) = 0
ORDER BY m."sortOrder";

-- RESTRICTED Module (haben Einträge in module_access)
SELECT 
    m.key,
    m.name,
    'RESTRICTED' as module_type,
    string_agg(ug.name, ', ') as allowed_groups
FROM modules m
INNER JOIN module_access ma ON m.id = ma."moduleId"
INNER JOIN user_groups ug ON ma."userGroupId" = ug.id
WHERE m."isActive" = true AND ma."canView" = true
GROUP BY m.id, m.key, m.name
ORDER BY m."sortOrder";
