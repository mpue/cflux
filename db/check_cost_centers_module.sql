SELECT m.id, m.name, m.key, m.route, m."isActive", m."sortOrder"
FROM modules m 
WHERE m.key = 'cost_centers';

SELECT ma."canView", ma."canCreate", ma."canEdit", ma."canDelete", ug.name as group_name
FROM modules m 
JOIN module_access ma ON m.id = ma."moduleId"
JOIN user_groups ug ON ma."userGroupId" = ug.id
WHERE m.key = 'cost_centers';
