-- Welche Module sollte matthias@pueski.de sehen?
WITH user_info AS (
    SELECT 
        u.id as user_id,
        u.email,
        ug.id as group_id,
        ug.name as group_name
    FROM users u
    LEFT JOIN user_group_memberships ugm ON u.id = ugm."userId"
    LEFT JOIN user_groups ug ON ugm."userGroupId" = ug.id
    WHERE u.email = 'matthias@pueski.de'
)
SELECT 
    m.key,
    m.name,
    m."sortOrder",
    ui.group_name,
    ma."canView",
    CASE 
        WHEN ma.id IS NULL THEN 'PUBLIC (keine Einschränkungen)'
        WHEN ma."userGroupId" = ui.group_id THEN 'ZUGRIFF ERLAUBT'
        ELSE 'ZUGRIFF VERWEIGERT'
    END as access_status
FROM modules m
CROSS JOIN user_info ui
LEFT JOIN module_access ma ON m.id = ma."moduleId" AND ma."userGroupId" = ui.group_id
WHERE m."isActive" = true
ORDER BY m."sortOrder";
