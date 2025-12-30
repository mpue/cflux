-- Simuliere die getModulesForUser-Abfrage für Markus Richter
SELECT DISTINCT
  m.id,
  m.name,
  m.key,
  m."sortOrder",
  m."isActive"
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
