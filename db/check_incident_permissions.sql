-- Check User Groups and their Module Access for incidents
SELECT 
    ug.name as "Group Name",
    ug."isActive" as "Active",
    m.key as "Module Key",
    m.name as "Module Name",
    ma."canView" as "Can View",
    ma."canCreate" as "Can Create",
    ma."canEdit" as "Can Edit",
    ma."canDelete" as "Can Delete"
FROM "UserGroup" ug
LEFT JOIN "ModuleAccess" ma ON ug.id = ma."userGroupId"
LEFT JOIN "Module" m ON ma."moduleId" = m.id
WHERE ug."isActive" = true
ORDER BY ug.name, m.key;

-- Check specific incidents module access
SELECT 
    ug.name as "Group Name",
    m.key as "Module Key",
    ma."canView",
    ma."canCreate",
    ma."canEdit",
    ma."canDelete"
FROM "UserGroup" ug
CROSS JOIN "Module" m
LEFT JOIN "ModuleAccess" ma ON (ug.id = ma."userGroupId" AND m.id = ma."moduleId")
WHERE m.key = 'incidents' AND ug."isActive" = true;

-- Check users in groups
SELECT 
    u."firstName",
    u."lastName",
    u.email,
    u.role,
    ug.name as "Group Name"
FROM "User" u
JOIN "UserGroupMembership" ugm ON u.id = ugm."userId"
JOIN "UserGroup" ug ON ugm."userGroupId" = ug.id
WHERE ug."isActive" = true
ORDER BY ug.name, u."lastName";
