-- Grant inventory module access to all users via their user groups
INSERT INTO module_access (
    "id",
    "userGroupId",
    "moduleId",
    "canView",
    "canCreate",
    "canEdit",
    "canDelete",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    ug.id,
    m.id,
    true,
    true,
    true,
    true,
    NOW(),
    NOW()
FROM user_groups ug
CROSS JOIN modules m
WHERE m.key = 'inventory'
AND NOT EXISTS (
    SELECT 1 
    FROM module_access ma 
    WHERE ma."userGroupId" = ug.id 
    AND ma."moduleId" = m.id
);
