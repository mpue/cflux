import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as departmentController from '../controllers/department.controller';

const router = Router();

router.use(authenticate);

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.get('/:id/available-employees', authorize('ADMIN'), departmentController.getAvailableEmployees);

router.post('/', authorize('ADMIN'), departmentController.createDepartment);
router.post('/:id/employees', authorize('ADMIN'), departmentController.addEmployeeToDepartment);

router.put('/:id', authorize('ADMIN'), departmentController.updateDepartment);

router.delete('/:id', authorize('ADMIN'), departmentController.deleteDepartment);
router.delete('/:id/employees/:employeeId', authorize('ADMIN'), departmentController.removeEmployeeFromDepartment);

export default router;
