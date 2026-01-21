-- E-Learning Module Berechtigungen für alle Benutzergruppen hinzufügen

-- Schritt 1: Modul-ID ermitteln
DO $$
DECLARE
    elearning_module_id UUID;
    user_group RECORD;
BEGIN
    -- Modul-ID holen
    SELECT id INTO elearning_module_id FROM modules WHERE key = 'elearning';
    
    IF elearning_module_id IS NULL THEN
        RAISE EXCEPTION 'E-Learning Modul nicht gefunden';
    END IF;
    
    -- Für jede Benutzergruppe Berechtigungen erstellen
    FOR user_group IN SELECT id, name FROM user_groups WHERE is_active = true
    LOOP
        -- Prüfen ob bereits existiert
        IF NOT EXISTS (
            SELECT 1 FROM module_access 
            WHERE module_id = elearning_module_id 
            AND user_group_id = user_group.id
        ) THEN
            -- Standard-Berechtigungen (alle können ansehen)
            INSERT INTO module_access (
                id,
                module_id,
                user_group_id,
                can_view,
                can_create,
                can_edit,
                can_delete,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                elearning_module_id,
                user_group.id,
                true,   -- Alle können E-Learning ansehen
                false,  -- Nur bestimmte Gruppen können erstellen
                false,  -- Nur bestimmte Gruppen können bearbeiten
                false,  -- Nur bestimmte Gruppen können löschen
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'E-Learning Zugriff für Gruppe % erstellt', user_group.name;
        ELSE
            RAISE NOTICE 'E-Learning Zugriff für Gruppe % existiert bereits', user_group.name;
        END IF;
    END LOOP;
    
    -- Admin/Manager/HR Gruppen bekommen volle Rechte
    UPDATE module_access 
    SET 
        can_create = true,
        can_edit = true,
        can_delete = true,
        updated_at = NOW()
    WHERE module_id = elearning_module_id
    AND user_group_id IN (
        SELECT id FROM user_groups 
        WHERE LOWER(name) IN ('admin', 'administrator', 'manager', 'hr', 'personalwesen', 'training')
    );
    
    RAISE NOTICE 'E-Learning Berechtigungen erfolgreich konfiguriert';
END $$;

-- Überprüfung: Alle Berechtigungen anzeigen
SELECT 
    ug.name as gruppe,
    ma.can_view as ansehen,
    ma.can_create as erstellen,
    ma.can_edit as bearbeiten,
    ma.can_delete as loeschen
FROM module_access ma
JOIN modules m ON ma.module_id = m.id
JOIN user_groups ug ON ma.user_group_id = ug.id
WHERE m.key = 'elearning'
ORDER BY ug.name;
