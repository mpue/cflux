-- Check workflow configuration for the "Login" workflow
SELECT 
  w.id,
  w.name,
  w.description,
  w."isActive",
  ws.id as step_id,
  ws.name as step_name,
  ws.type as step_type,
  ws.config as step_config,
  ws."order" as step_order
FROM workflows w
LEFT JOIN workflow_steps ws ON w.id = ws."workflowId"
WHERE w.name = 'Login'
ORDER BY ws."order";
