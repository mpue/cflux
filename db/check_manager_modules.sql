-- Zeige Module für die Gruppe "Manager"
SELECT 
  m.name as module_name,
  m.key as module_key,
  m."isActive" as module_active,
  ma."canView",
  ma."canCreate",
  ma."canEdit",
  ma."canDelete",
  ug.name as group_name
FROM module_access ma
JOIN modules m ON ma."moduleId" = m.id
JOIN user_groups ug ON ma."userGroupId" = ug.id
WHERE ug.name = 'Manager'
ORDER BY m."sortOrder", m.name;
