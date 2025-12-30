SELECT 
  i.id, 
  i."invoiceNumber", 
  i."totalAmount", 
  i.status,
  wi.id as workflow_instance_id,
  wi.status as workflow_status
FROM invoices i 
LEFT JOIN workflow_instances wi ON wi."invoiceId" = i.id 
WHERE wi.id = '2d1d7006-4515-4a91-a4c0-5f441cb1433f';
