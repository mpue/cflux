import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllDevices,
  getDeviceById,
  getDevicesByUser,
  createDevice,
  updateDevice,
  deleteDevice,
  assignDevice,
  returnDevice
} from '../controllers/device.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all devices (Admin only)
router.get('/', authorize('ADMIN'), getAllDevices);

// Get device by ID (Admin only)
router.get('/:id', authorize('ADMIN'), getDeviceById);

// Get devices by user
router.get('/user/:userId', getDevicesByUser);

// Create device (Admin only)
router.post('/', authorize('ADMIN'), createDevice);

// Update device (Admin only)
router.put('/:id', authorize('ADMIN'), updateDevice);

// Delete device (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteDevice);

// Assign device to user (Admin only)
router.post('/:id/assign', authorize('ADMIN'), assignDevice);

// Return device (unassign) (Admin only)
router.post('/:id/return', authorize('ADMIN'), returnDevice);

export default router;
