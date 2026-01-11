import { Router } from 'express';
import { actionController } from '../controllers/action.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ========== SYSTEM ACTIONS ==========

/**
 * @route   GET /api/actions
 * @desc    Alle System Actions abrufen
 * @access  Private
 */
router.get('/', authenticate, actionController.getAllSystemActions);

/**
 * @route   GET /api/actions/:actionKey
 * @desc    System Action nach Key abrufen
 * @access  Private
 */
router.get('/:actionKey', authenticate, actionController.getSystemActionByKey);

/**
 * @route   POST /api/actions
 * @desc    Neue System Action erstellen
 * @access  Admin
 */
router.post('/', authenticate, requireAdmin, actionController.createSystemAction);

/**
 * @route   PUT /api/actions/:actionKey
 * @desc    System Action aktualisieren
 * @access  Admin
 */
router.put('/:actionKey', authenticate, requireAdmin, actionController.updateSystemAction);

/**
 * @route   DELETE /api/actions/:actionKey
 * @desc    System Action löschen
 * @access  Admin
 */
router.delete('/:actionKey', authenticate, requireAdmin, actionController.deleteSystemAction);

// ========== SEEDING ==========

/**
 * @route   POST /api/actions/seed
 * @desc    Standard System Actions initialisieren
 * @access  Admin
 */
router.post('/seed', authenticate, requireAdmin, actionController.seedSystemActions);

// ========== ACTION LOGS ==========

/**
 * @route   GET /api/actions/logs
 * @desc    Action Logs abrufen
 * @access  Admin
 */
router.get('/logs', authenticate, requireAdmin, actionController.getActionLogs);

/**
 * @route   GET /api/actions/statistics
 * @desc    Action Statistics abrufen
 * @access  Admin
 */
router.get('/statistics', authenticate, requireAdmin, actionController.getActionStatistics);

// ========== WORKFLOW TRIGGERS ==========

/**
 * @route   POST /api/actions/triggers
 * @desc    Workflow Trigger erstellen
 * @access  Admin
 */
router.post('/triggers', authenticate, requireAdmin, actionController.createWorkflowTrigger);

/**
 * @route   GET /api/actions/workflows/:workflowId/triggers
 * @desc    Alle Trigger für einen Workflow
 * @access  Private
 */
router.get('/workflows/:workflowId/triggers', authenticate, actionController.getWorkflowTriggers);

/**
 * @route   PUT /api/actions/triggers/:id
 * @desc    Workflow Trigger aktualisieren
 * @access  Admin
 */
router.put('/triggers/:id', authenticate, requireAdmin, actionController.updateWorkflowTrigger);

/**
 * @route   DELETE /api/actions/triggers/:id
 * @desc    Workflow Trigger löschen
 * @access  Admin
 */
router.delete('/triggers/:id', authenticate, requireAdmin, actionController.deleteWorkflowTrigger);

/**
 * @route   PATCH /api/actions/triggers/:id/toggle
 * @desc    Workflow Trigger aktivieren/deaktivieren
 * @access  Admin
 */
router.patch('/triggers/:id/toggle', authenticate, requireAdmin, actionController.toggleWorkflowTrigger);

// ========== SYSTEM ACTIONS (mit :actionKey am Ende wegen Route-Konflikt) ==========

/**
 * @route   POST /api/actions/:actionKey/trigger
 * @desc    Action manuell triggern (für Tests)
 * @access  Admin
 */
router.post('/:actionKey/trigger', authenticate, requireAdmin, actionController.triggerAction);

/**
 * @route   GET /api/actions/:actionKey/triggers
 * @desc    Alle Triggers für eine Action
 * @access  Private
 */
router.get('/:actionKey/triggers', authenticate, actionController.getActionTriggers);

/**
 * @route   GET /api/actions/:actionKey
 * @desc    System Action nach Key abrufen
 * @access  Private
 */
router.get('/:actionKey', authenticate, actionController.getSystemActionByKey);

/**
 * @route   PUT /api/actions/:actionKey
 * @desc    System Action aktualisieren
 * @access  Admin
 */
router.put('/:actionKey', authenticate, requireAdmin, actionController.updateSystemAction);

/**
 * @route   DELETE /api/actions/:actionKey
 * @desc    System Action löschen
 * @access  Admin
 */
router.delete('/:actionKey', authenticate, requireAdmin, actionController.deleteSystemAction);

export default router;
