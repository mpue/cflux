import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as supplierController from '../controllers/supplier.controller';

const router = Router();

router.use(authenticate);

router.get('/', supplierController.getAllSuppliers);
router.get('/export/json', authorize('ADMIN'), supplierController.exportSuppliers);
router.get('/:id', supplierController.getSupplierById);

router.post('/', authorize('ADMIN'), supplierController.createSupplier);
router.post('/import/json', authorize('ADMIN'), supplierController.importSuppliers);
router.put('/:id', authorize('ADMIN'), supplierController.updateSupplier);
router.delete('/:id', authorize('ADMIN'), supplierController.deleteSupplier);

export default router;
