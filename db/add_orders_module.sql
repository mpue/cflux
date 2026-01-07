-- Bestellungen Module

-- Insert module if it doesn't exist
INSERT INTO modules (id, name, key, description, icon, route, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Bestellungen',
  'orders',
  'Verwaltung von Bestellungen und Wareneingang',
  'ShoppingCart',
  '/orders',
  true,
  90,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Grant access to Admin group (assuming it exists)
INSERT INTO module_access (id, "moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  m.id,
  ug.id,
  true,
  true,
  true,
  true,
  NOW(),
  NOW()
FROM modules m
CROSS JOIN user_groups ug
WHERE m.key = 'orders' 
  AND ug.name = 'Admins'
  AND NOT EXISTS (
    SELECT 1 FROM module_access ma 
    WHERE ma."moduleId" = m.id AND ma."userGroupId" = ug.id
  );

-- Grant view and create access to Manager group (if it exists)
INSERT INTO module_access (id, "moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  m.id,
  ug.id,
  true,
  true,
  false,
  false,
  NOW(),
  NOW()
FROM modules m
CROSS JOIN user_groups ug
WHERE m.key = 'orders' 
  AND ug.name = 'Manager'
  AND NOT EXISTS (
    SELECT 1 FROM module_access ma 
    WHERE ma."moduleId" = m.id AND ma."userGroupId" = ug.id
  );

-- Grant view access to Benutzer group (if it exists)
INSERT INTO module_access (id, "moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  m.id,
  ug.id,
  true,
  true,
  false,
  false,
  NOW(),
  NOW()
FROM modules m
CROSS JOIN user_groups ug
WHERE m.key = 'orders' 
  AND ug.name = 'Benutzer'
  AND NOT EXISTS (
    SELECT 1 FROM module_access ma 
    WHERE ma."moduleId" = m.id AND ma."userGroupId" = ug.id
  );
