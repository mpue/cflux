import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as userGroupController from '../controllers/userGroup.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

router.post('/', userGroupController.createUserGroup);
router.get('/', userGroupController.getAllUserGroups);
router.get('/:id', userGroupController.getUserGroupById);
router.put('/:id', userGroupController.updateUserGroup);
router.delete('/:id', userGroupController.deleteUserGroup);
router.post('/:id/users', userGroupController.addUserToGroup);
router.delete('/:id/users/:userId', userGroupController.removeUserFromGroup);
router.get('/:id/users', userGroupController.getUsersByGroup);

// New routes for managing user's groups
router.get('/users/:userId/groups', userGroupController.getUserGroups);
router.put('/users/:userId/groups', userGroupController.setUserGroups);

export default router;
