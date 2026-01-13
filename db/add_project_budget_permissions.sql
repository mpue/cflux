-- Add Project Budget module permissions for all user groups
-- This script grants default permissions to various user groups

-- First, get the module ID for project_budget
DO $$
DECLARE
    v_module_id INTEGER;
    v_admin_group_id INTEGER;
    v_manager_group_id INTEGER;
    v_user_group_id INTEGER;
BEGIN
    -- Get module ID
    SELECT id INTO v_module_id FROM "Module" WHERE key = 'project_budget';
    
    IF v_module_id IS NULL THEN
        RAISE NOTICE 'Project Budget module not found. Please run seedModules.ts first.';
        RETURN;
    END IF;

    -- Get group IDs
    SELECT id INTO v_admin_group_id FROM "UserGroup" WHERE name = 'Administrators';
    SELECT id INTO v_manager_group_id FROM "UserGroup" WHERE name = 'Managers';
    SELECT id INTO v_user_group_id FROM "UserGroup" WHERE name = 'Users';

    -- Grant full permissions to Administrators
    IF v_admin_group_id IS NOT NULL THEN
        INSERT INTO "ModuleAccess" ("moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
        VALUES (v_module_id, v_admin_group_id, true, true, true, true, NOW(), NOW())
        ON CONFLICT ("moduleId", "userGroupId") DO UPDATE
        SET "canView" = true, "canCreate" = true, "canEdit" = true, "canDelete" = true, "updatedAt" = NOW();
        
        RAISE NOTICE 'Granted full access to Administrators';
    END IF;

    -- Grant view, create, edit permissions to Managers
    IF v_manager_group_id IS NOT NULL THEN
        INSERT INTO "ModuleAccess" ("moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
        VALUES (v_module_id, v_manager_group_id, true, true, true, false, NOW(), NOW())
        ON CONFLICT ("moduleId", "userGroupId") DO UPDATE
        SET "canView" = true, "canCreate" = true, "canEdit" = true, "canDelete" = false, "updatedAt" = NOW();
        
        RAISE NOTICE 'Granted view/create/edit access to Managers';
    END IF;

    -- Grant view-only permissions to Users
    IF v_user_group_id IS NOT NULL THEN
        INSERT INTO "ModuleAccess" ("moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
        VALUES (v_module_id, v_user_group_id, true, false, false, false, NOW(), NOW())
        ON CONFLICT ("moduleId", "userGroupId") DO UPDATE
        SET "canView" = true, "canCreate" = false, "canEdit" = false, "canDelete" = false, "updatedAt" = NOW();
        
        RAISE NOTICE 'Granted view-only access to Users';
    END IF;

    RAISE NOTICE 'Project Budget permissions configured successfully';
END $$;

-- Verify the permissions
SELECT 
    m.name AS module_name,
    ug.name AS group_name,
    ma."canView",
    ma."canCreate",
    ma."canEdit",
    ma."canDelete"
FROM "ModuleAccess" ma
JOIN "Module" m ON ma."moduleId" = m.id
JOIN "UserGroup" ug ON ma."userGroupId" = ug.id
WHERE m.key = 'project_budget'
ORDER BY ug.name;
