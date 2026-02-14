import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getCurrentUser);
router.post('/change-password', userController.changePassword);
router.get('/list', userController.getUsersList); // Basic user list for all authenticated users
router.get('/org-chart', authorize('ADMIN'), userController.getOrgChart);
router.get('/export', authorize('ADMIN'), userController.exportUsers);
router.post('/import', authorize('ADMIN'), userController.importUsers);
router.get('/', authorize('ADMIN'), userController.getAllUsers);
router.get('/:id', authorize('ADMIN'), userController.getUserById);
router.get('/:id/subordinates', authorize('ADMIN'), userController.getSubordinates);
router.put('/:id', authorize('ADMIN'), userController.updateUser);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

export default router;
