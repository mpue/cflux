-- Prüfe Benutzer, ihre Gruppen und Modulzugriffe
SELECT 
  u.email, 
  u.role,
  ug.name as group_name,
  COUNT(DISTINCT ugm.id) as group_count
FROM users u
LEFT JOIN user_group_memberships ugm ON u.id = ugm."userId"
LEFT JOIN user_groups ug ON ugm."userGroupId" = ug.id
GROUP BY u.id, u.email, u.role, ug.name
ORDER BY u.email;
