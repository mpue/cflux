import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as customerController from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);

router.post('/', authorize('ADMIN'), customerController.createCustomer);
router.put('/:id', authorize('ADMIN'), customerController.updateCustomer);
router.delete('/:id', authorize('ADMIN'), customerController.deleteCustomer);

export default router;
