-- Add incidents module access to all active user groups
-- This gives READ and WRITE permissions to the incidents module

DO $$
DECLARE
    v_module_id uuid;
    v_group record;
BEGIN
    -- Get incidents module ID
    SELECT id INTO v_module_id FROM "Module" WHERE key = 'incidents';
    
    IF v_module_id IS NULL THEN
        RAISE EXCEPTION 'incidents module not found';
    END IF;
    
    RAISE NOTICE 'Found incidents module with ID: %', v_module_id;
    
    -- Loop through all active user groups
    FOR v_group IN 
        SELECT id, name FROM "UserGroup" WHERE "isActive" = true
    LOOP
        -- Check if access already exists
        IF NOT EXISTS (
            SELECT 1 FROM "ModuleAccess" 
            WHERE "userGroupId" = v_group.id 
            AND "moduleId" = v_module_id
        ) THEN
            -- Insert new module access
            INSERT INTO "ModuleAccess" (
                id,
                "userGroupId",
                "moduleId",
                "canView",
                "canCreate",
                "canEdit",
                "canDelete",
                "createdAt",
                "updatedAt"
            ) VALUES (
                gen_random_uuid(),
                v_group.id,
                v_module_id,
                true,
                true,
                true,
                true,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Added incidents access for group: %', v_group.name;
        ELSE
            RAISE NOTICE 'incidents access already exists for group: %', v_group.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed adding incidents module access';
END $$;

-- Verify the changes
SELECT 
    ug.name as "Group Name",
    m.key as "Module Key",
    ma."canView" as "View",
    ma."canCreate" as "Create",
    ma."canEdit" as "Edit",
    ma."canDelete" as "Delete"
FROM "UserGroup" ug
JOIN "ModuleAccess" ma ON ug.id = ma."userGroupId"
JOIN "Module" m ON ma."moduleId" = m.id
WHERE m.key = 'incidents' AND ug."isActive" = true
ORDER BY ug.name;
