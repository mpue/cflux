import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { incidentAttachmentController } from '../controllers/incidentAttachment.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Multer configuration for incident attachments
const uploadDir = path.join(__dirname, '../../uploads/incident-attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// All routes require authentication
router.use(authenticate);

// Get all incidents (with optional filters)
router.get('/', incidentController.getAllIncidents);

// Export incidents as CSV
router.get('/export/csv', incidentController.exportCSV);

// Get statistics
router.get('/statistics', incidentController.getStatistics);

// Reorder incidents (drag & drop)
router.put('/reorder', incidentController.reorder);

// Attachment routes (must be before /:id to avoid route conflicts)
router.get('/attachments/:attachmentId/download', incidentAttachmentController.downloadAttachment);
router.delete('/attachments/:attachmentId', incidentAttachmentController.deleteAttachment);

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

// Attachment routes per incident
router.get('/:incidentId/attachments', incidentAttachmentController.getAttachments);
router.post('/:incidentId/attachments', upload.single('file'), incidentAttachmentController.uploadAttachment);

export default router;
