import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ehsTodoController from '../controllers/ehsTodo.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all todos (with filters)
router.get('/', ehsTodoController.getAllTodos);

// Get single todo
router.get('/:id', ehsTodoController.getTodoById);

// Create new todo
router.post('/', ehsTodoController.createTodo);

// Update todo
router.put('/:id', ehsTodoController.updateTodo);

// Delete todo (soft delete)
router.delete('/:id', ehsTodoController.deleteTodo);

// Get todos by project
router.get('/project/:projectId', ehsTodoController.getTodosByProject);

// Get todos by incident
router.get('/incident/:incidentId', ehsTodoController.getTodosByIncident);

// Get my assigned todos
router.get('/my/assigned', ehsTodoController.getMyAssignedTodos);

// Get todos I created
router.get('/my/created', ehsTodoController.getMyCreatedTodos);

// Update todo status
router.patch('/:id/status', ehsTodoController.updateTodoStatus);

// Update todo progress
router.patch('/:id/progress', ehsTodoController.updateTodoProgress);

// Get statistics
router.get('/stats/overview', ehsTodoController.getTodoStatistics);

export default router;
