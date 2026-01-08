-- Überprüfung: Welche Module sieht die User-Gruppe?
SELECT 
    m.key,
    m.name,
    m."isActive",
    ug.name as group_name,
    ma."canView",
    ma."canCreate",
    ma."canEdit",
    ma."canDelete"
FROM modules m
LEFT JOIN module_access ma ON m.id = ma."moduleId"
LEFT JOIN user_groups ug ON ma."userGroupId" = ug.id
WHERE m."isActive" = true
ORDER BY 
    CASE WHEN ug.name IS NULL THEN 0 ELSE 1 END,
    ug.name,
    m."sortOrder";
