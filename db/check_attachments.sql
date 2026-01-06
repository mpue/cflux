-- Check Document Node Attachments Tables

-- 1. Check if tables exist
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename IN ('document_node_attachments', 'document_node_attachment_versions')
ORDER BY tablename;

-- 2. Check attachments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'document_node_attachments'
ORDER BY ordinal_position;

-- 3. Check versions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'document_node_attachment_versions'
ORDER BY ordinal_position;

-- 4. Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('document_node_attachments', 'document_node_attachment_versions')
ORDER BY indexname;

-- 5. Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('document_node_attachments', 'document_node_attachment_versions')
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 6. Count existing attachments (should be 0 after fresh migration)
SELECT 
    'Total Attachments' as metric,
    COUNT(*) as count
FROM document_node_attachments
UNION ALL
SELECT 
    'Active Attachments' as metric,
    COUNT(*) as count
FROM document_node_attachments
WHERE "isActive" = true AND "deletedAt" IS NULL
UNION ALL
SELECT 
    'Deleted Attachments' as metric,
    COUNT(*) as count
FROM document_node_attachments
WHERE "isActive" = false OR "deletedAt" IS NOT NULL
UNION ALL
SELECT 
    'Total Versions' as metric,
    COUNT(*) as count
FROM document_node_attachment_versions;

-- 7. Check attachment statistics by document node (will be empty initially)
SELECT 
    dn.id as node_id,
    dn.title as node_title,
    dn.type as node_type,
    COUNT(dna.id) as attachment_count,
    SUM(dna."fileSize") as total_size_bytes,
    ROUND(SUM(dna."fileSize")::numeric / 1024 / 1024, 2) as total_size_mb
FROM document_nodes dn
LEFT JOIN document_node_attachments dna 
    ON dn.id = dna."documentNodeId" 
    AND dna."isActive" = true 
    AND dna."deletedAt" IS NULL
GROUP BY dn.id, dn.title, dn.type
HAVING COUNT(dna.id) > 0
ORDER BY attachment_count DESC
LIMIT 10;
