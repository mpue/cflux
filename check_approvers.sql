SELECT 
  ws.id,
  ws.name,
  ws.type,
  ws."order",
  ws."approverUserIds"
FROM workflow_steps ws
WHERE ws."workflowId" = '990b32f7-0670-4b12-84c0-7aeeb26f6c13'
ORDER BY ws."order";
