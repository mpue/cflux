import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getCurrentUser);
router.get('/', authorize('ADMIN'), userController.getAllUsers);
router.get('/:id', authorize('ADMIN'), userController.getUserById);
router.put('/:id', authorize('ADMIN'), userController.updateUser);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

export default router;
