-- Check Laura's permissions for incidents
-- 1. Check if Laura exists and her groups
SELECT 
    u."firstName",
    u."lastName",
    u.email,
    u.role,
    u."isActive",
    ug.name as "Group Name",
    ug."isActive" as "Group Active"
FROM "User" u
LEFT JOIN "UserGroupMembership" ugm ON u.id = ugm."userId"
LEFT JOIN "UserGroup" ug ON ugm."userGroupId" = ug.id
WHERE u.email = 'laura.bauer@example.com';

-- 2. Check incidents module access for "Benutzer" group
SELECT 
    ug.name as "Group Name",
    m.key as "Module Key",
    m.name as "Module Name",
    ma."canView",
    ma."canCreate",
    ma."canEdit",
    ma."canDelete"
FROM "UserGroup" ug
JOIN "ModuleAccess" ma ON ug.id = ma."userGroupId"
JOIN "Module" m ON ma."moduleId" = m.id
WHERE ug.name ILIKE '%benutzer%' AND m.key = 'incidents';

-- 3. Check ALL module access for groups Laura is in
SELECT 
    ug.name as "Group Name",
    m.key as "Module Key",
    m.name as "Module Name",
    ma."canView",
    ma."canCreate",
    ma."canEdit",
    ma."canDelete"
FROM "User" u
JOIN "UserGroupMembership" ugm ON u.id = ugm."userId"
JOIN "UserGroup" ug ON ugm."userGroupId" = ug.id
JOIN "ModuleAccess" ma ON ug.id = ma."userGroupId"
JOIN "Module" m ON ma."moduleId" = m.id
WHERE u.email = 'laura.bauer@example.com'
ORDER BY ug.name, m.key;
