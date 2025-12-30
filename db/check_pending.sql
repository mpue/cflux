SELECT 
  wis.id as step_instance_id,
  wis.status as step_status,
  ws.name as step_name,
  ws.type as step_type,
  ws."approverUserIds",
  i."invoiceNumber",
  i."totalAmount"
FROM workflow_instance_steps wis
JOIN workflow_steps ws ON ws.id = wis."stepId"
JOIN workflow_instances wi ON wi.id = wis."instanceId"
JOIN invoices i ON i.id = wi."invoiceId"
WHERE wis.status = 'PENDING'
AND ws."approverUserIds" LIKE '%ca80fe53-bb2d-4b9f-adbc-d43c8ed0cae8%'
ORDER BY wi."startedAt" DESC;
