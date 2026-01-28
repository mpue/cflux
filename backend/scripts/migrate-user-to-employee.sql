-- Migration Script: Create Employee profiles for all existing users
-- This ensures all users have an employee profile with default values

DO $$
DECLARE
    user_record RECORD;
    employee_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting User to Employee migration...';
    
    -- Loop through all users
    FOR user_record IN 
        SELECT u.id, u.email, u."firstName", u."lastName"
        FROM users u
        LEFT JOIN employees e ON e."userId" = u.id
        WHERE e.id IS NULL
    LOOP
        -- Create employee profile with default values
        INSERT INTO employees (
            id,
            "userId",
            "firstName",
            "lastName",
            email,
            "weeklyHours",
            "vacationDays",
            canton,
            country,
            "exemptFromTracking",
            "isActive",
            "createdAt",
            "updatedAt"
        ) VALUES (
            gen_random_uuid(),
            user_record.id,
            user_record."firstName",
            user_record."lastName",
            user_record.email,
            45, -- Default Swiss work week
            30, -- Default vacation days
            'ZH', -- Default canton
            'Schweiz',
            false,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created employee profile for user: %', user_record.email;
    END LOOP;
    
    -- Get count of employees created
    SELECT COUNT(*) INTO employee_count FROM employees;
    
    RAISE NOTICE 'Migration completed! Total employees: %', employee_count;
END $$;

-- Update existing employee profiles to sync firstName, lastName, email
UPDATE employees e
SET 
    "firstName" = u."firstName",
    "lastName" = u."lastName",
    email = u.email,
    "updatedAt" = NOW()
FROM users u
WHERE e."userId" = u.id
  AND (
    e."firstName" != u."firstName" OR
    e."lastName" != u."lastName" OR
    e.email != u.email
  );

-- Verify results
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM employees) as total_employees,
    (SELECT COUNT(*) FROM employees WHERE "userId" IS NOT NULL) as employees_with_user;
