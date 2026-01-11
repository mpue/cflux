-- Check workflow triggers for timeentry and user actions
SELECT 
  wt.id, 
  sa."actionKey", 
  sa."displayName", 
  w.name as workflow_name, 
  wt.timing, 
  wt."isActive",
  wt."priority",
  wt.condition
FROM workflow_triggers wt 
JOIN system_actions sa ON wt."actionKey" = sa."actionKey" 
JOIN workflows w ON wt."workflowId" = w.id 
WHERE sa."actionKey" LIKE 'timeentry%' 
   OR sa."actionKey" LIKE 'user.login%'
ORDER BY sa."actionKey", wt."priority" DESC;
