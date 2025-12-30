-- Zeige Benutzer und ihre Gruppenmitgliedschaften
SELECT 
  u.email, 
  u."firstName", 
  u."lastName", 
  ug.name as group_name,
  ug."isActive" as group_active
FROM users u 
JOIN user_group_memberships ugm ON u.id = ugm."userId" 
JOIN user_groups ug ON ugm."userGroupId" = ug.id 
WHERE u.email LIKE '%markus%'
ORDER BY u.email, ug.name;
