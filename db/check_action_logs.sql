-- Check recent action logs
SELECT 
  al.id,
  al."actionKey",
  al."userId",
  al.success,
  al."executionTime",
  al."triggeredWorkflows",
  al."createdAt",
  u.email
FROM action_logs al
LEFT JOIN users u ON al."userId" = u.id
ORDER BY al."createdAt" DESC
LIMIT 10;
