import express from 'express';
import { authenticate } from '../middleware/auth';
import * as orderController from '../controllers/order.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get order statistics
router.get('/statistics', orderController.getOrderStatistics);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get single order
router.get('/:id', orderController.getOrderById);

// Create new order
router.post('/', orderController.createOrder);

// Update order
router.put('/:id', orderController.updateOrder);

// Request order approval
router.post('/:id/request-approval', orderController.requestOrderApproval);

// Approve order
router.post('/:id/approve', orderController.approveOrder);

// Reject order
router.post('/:id/reject', orderController.rejectOrder);

// Mark as ordered
router.post('/:id/mark-ordered', orderController.markOrderAsOrdered);

// Record delivery
router.post('/:id/deliveries', orderController.recordDelivery);

// Cancel order
router.post('/:id/cancel', orderController.cancelOrder);

// Delete order (soft delete)
router.delete('/:id', orderController.deleteOrder);

export default router;
