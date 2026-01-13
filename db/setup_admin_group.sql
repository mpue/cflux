-- Create Admin User Group if not exists
INSERT INTO user_groups (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(), 
  'Administratoren', 
  'Voller Zugriff auf alle Module', 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (SELECT 1 FROM user_groups WHERE name = 'Administratoren');

-- Assign all admin users to the admin group
INSERT INTO user_group_memberships (id, "userId", "userGroupId", "createdAt")
SELECT 
  gen_random_uuid(), 
  u.id, 
  ug.id, 
  now()
FROM users u
CROSS JOIN user_groups ug
WHERE u.role = 'ADMIN' 
AND ug.name = 'Administratoren'
AND NOT EXISTS (
  SELECT 1 
  FROM user_group_memberships ugm 
  WHERE ugm."userId" = u.id 
  AND ugm."userGroupId" = ug.id
);

-- Grant admin group access to all modules
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
WHERE ug.name = 'Administratoren'
AND NOT EXISTS (
  SELECT 1 
  FROM module_access ma 
  WHERE ma."moduleId" = m.id 
  AND ma."userGroupId" = ug.id
);
