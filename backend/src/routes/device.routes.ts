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
  returnDevice,
  exportDevices,
  importDevices,
  getDeviceSoftware,
  createDeviceSoftware,
  updateDeviceSoftware,
  deleteDeviceSoftware,
  testAction1Connection,
  syncAllDevicesFromAction1,
  getAction1SyncStatus,
  syncDeviceFromAction1,
  getDeviceUpdates,
  getDeviceVulnerabilities,
  deployDeviceUpdates,
  getSoftwareReport,
  getSoftwareInstallations
} from '../controllers/device.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all devices (Admin only)
router.get('/', authorize('ADMIN'), getAllDevices);

// Export devices (Admin only)
router.get('/export/json', authorize('ADMIN'), exportDevices);

// Get device by ID (Admin only)
router.get('/:id', authorize('ADMIN'), getDeviceById);

// Get devices by user
router.get('/user/:userId', getDevicesByUser);

// Create device (Admin only)
router.post('/', authorize('ADMIN'), createDevice);

// Import devices (Admin only)
router.post('/import/json', authorize('ADMIN'), importDevices);

// Update device (Admin only)
router.put('/:id', authorize('ADMIN'), updateDevice);

// Delete device (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteDevice);

// Assign device to user (Admin only)
router.post('/:id/assign', authorize('ADMIN'), assignDevice);

// Return device (unassign) (Admin only)
router.post('/:id/return', authorize('ADMIN'), returnDevice);

// Software / Lizenzen pro Gerät (Admin only)
router.get('/:id/software', authorize('ADMIN'), getDeviceSoftware);
router.get('/:id/updates', authorize('ADMIN'), getDeviceUpdates);
router.post('/:id/updates/deploy', authorize('ADMIN'), deployDeviceUpdates);
router.get('/:id/vulnerabilities', authorize('ADMIN'), getDeviceVulnerabilities);

// Software-Asset-Report (Admin only)
router.get('/software/report', authorize('ADMIN'), getSoftwareReport);
router.get('/software/report/installations', authorize('ADMIN'), getSoftwareInstallations);
router.post('/:id/software', authorize('ADMIN'), createDeviceSoftware);
router.put('/:id/software/:softwareId', authorize('ADMIN'), updateDeviceSoftware);
router.delete('/:id/software/:softwareId', authorize('ADMIN'), deleteDeviceSoftware);

// Action1-Integration (Admin only)
router.get('/action1/test', authorize('ADMIN'), testAction1Connection);
router.post('/action1/sync', authorize('ADMIN'), syncAllDevicesFromAction1);
router.get('/action1/sync/status', authorize('ADMIN'), getAction1SyncStatus);
router.post('/:id/action1/sync', authorize('ADMIN'), syncDeviceFromAction1);

export default router;
