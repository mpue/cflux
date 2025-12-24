import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all incidents (with optional filters)
router.get('/', incidentController.getAllIncidents);

// Get statistics
router.get('/statistics', incidentController.getStatistics);

// Get incident by ID
router.get('/:id', incidentController.getIncidentById);

// Create new incident
router.post('/', incidentController.createIncident);

// Update incident
router.put('/:id', incidentController.updateIncident);

// Delete incident
router.delete('/:id', incidentController.deleteIncident);

// Add comment to incident
router.post('/:id/comments', incidentController.addComment);

// Get comments for incident
router.get('/:id/comments', incidentController.getComments);

export default router;
