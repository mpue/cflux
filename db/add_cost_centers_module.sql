INSERT INTO module_access (id, "moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(), 
  m.id, 
  ug.id, 
  true, 
  true, 
  true, 
  true, 
  now(), 
  now()
FROM modules m 
CROSS JOIN user_groups ug 
WHERE m.key = 'cost_centers' 
AND NOT EXISTS (
  SELECT 1 
  FROM module_access ma 
  WHERE ma."moduleId" = m.id 
  AND ma."userGroupId" = ug.id
);
