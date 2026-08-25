import express from 'express';
import { authenticate, denyApiKey } from '../middleware/auth';
import {
  getApiKeys,
  getAvailableScopes,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
} from '../controllers/apiKey.controller';

const router = express.Router();

// Schluesselverwaltung ist ausschliesslich mit einem echten Login moeglich —
// ein API-Schluessel darf sich nicht selbst verlaengern oder neue ausstellen.
router.use(authenticate);
router.use(denyApiKey);

router.get('/scopes', getAvailableScopes);
router.get('/', getApiKeys);
router.post('/', createApiKey);
router.put('/:id', updateApiKey);
router.post('/:id/revoke', revokeApiKey);
router.delete('/:id', deleteApiKey);

export default router;
