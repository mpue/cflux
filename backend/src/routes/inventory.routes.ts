import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all inventory items
router.get('/', inventoryController.getAllInventoryItems);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems);

// Get single inventory item
router.get('/:id', inventoryController.getInventoryItemById);

// Create or update inventory item
router.post('/', inventoryController.upsertInventoryItem);

// Record inventory movement
router.post('/movement', inventoryController.recordMovement);

// Delete inventory item
router.delete('/:id', inventoryController.deleteInventoryItem);

export default router;
