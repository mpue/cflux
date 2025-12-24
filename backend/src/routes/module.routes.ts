import express from 'express';
import {
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deleteModule,
  getModulesForUser,
  grantModuleAccess,
  updateModuleAccess,
  revokeModuleAccess,
  getModuleAccessByGroup,
  getGroupsForModule,
} from '../controllers/module.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Module management (admin only)
router.post('/', requireAdmin, createModule);
router.get('/', getAllModules);
router.get('/:id', getModuleById);
router.put('/:id', requireAdmin, updateModule);
router.delete('/:id', requireAdmin, deleteModule);

// User module access
router.get('/user/me', getModulesForUser);
router.get('/user/:userId', getModulesForUser);

// Module access management (admin only)
router.post('/:moduleId/access', requireAdmin, grantModuleAccess);
router.put('/access/:accessId', requireAdmin, updateModuleAccess);
router.delete('/access/:accessId', requireAdmin, revokeModuleAccess);
router.get('/group/:groupId/access', getModuleAccessByGroup);
router.get('/:moduleId/groups', getGroupsForModule);

export default router;
