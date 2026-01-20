-- Check imported DLK articles
SELECT 
    "articleNumber",
    LEFT(name, 80) as name,
    CASE 
        WHEN description IS NOT NULL THEN 'Ja'
        ELSE 'Nein'
    END as has_description,
    price,
    "vatRate",
    "isActive"
FROM articles 
WHERE unit = 'Dienstleistung'
ORDER BY CAST("articleNumber" AS INTEGER);
