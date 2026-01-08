-- Prüfe Modulberechtigungen für Dashboard-Module
SELECT 
  m.key, 
  m.name, 
  ug.name as group_name, 
  ma."canView", 
  ma."canCreate", 
  ma."canEdit", 
  ma."canDelete" 
FROM modules m 
LEFT JOIN module_access ma ON m.id = ma."moduleId" 
LEFT JOIN user_groups ug ON ma."userGroupId" = ug.id 
WHERE m.key IN ('ehs', 'incidents', 'intranet', 'media', 'workflow', 'messages', 'travel_expenses') 
ORDER BY m.key, ug.name;
