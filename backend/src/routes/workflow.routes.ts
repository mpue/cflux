import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All workflow routes require authentication
router.use(authenticate);

// Workflows
router.post('/', workflowController.createWorkflow);
router.get('/', workflowController.getAllWorkflows);

// My Approvals (must be before /:id to avoid conflict)
router.get('/my-approvals', workflowController.getMyPendingApprovals);

router.get('/:id', workflowController.getWorkflowById);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

// Workflow Steps
router.post('/:workflowId/steps', workflowController.createWorkflowStep);
router.put('/steps/:id', workflowController.updateWorkflowStep);
router.delete('/steps/:id', workflowController.deleteWorkflowStep);

// Template-Workflow Links
router.post('/template-links', workflowController.linkWorkflowToTemplate);
router.delete('/template-links/:templateId/:workflowId', workflowController.unlinkWorkflowFromTemplate);
router.get('/templates/:templateId', workflowController.getTemplateWorkflows);

// Workflow Instances
router.get('/invoices/:invoiceId/instances', workflowController.getInvoiceWorkflowInstances);
router.get('/entities/:entityType/:entityId/instances', workflowController.getEntityWorkflowInstances);
router.post('/instances/steps/:instanceStepId/approve', workflowController.approveWorkflowStep);
router.post('/instances/steps/:instanceStepId/reject', workflowController.rejectWorkflowStep);
router.get('/invoices/:invoiceId/check-approval', workflowController.checkInvoiceApproval);

export default router;
