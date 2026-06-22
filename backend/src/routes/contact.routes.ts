import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getAllContactGroups,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
  syncEmployees,
} from '../controllers/contact.controller';

const router = express.Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticate);

// ===== Kontaktgruppen (vor /:id, damit "groups" nicht als ID interpretiert wird) =====
router.get('/groups', getAllContactGroups);
router.post('/groups', authorize('ADMIN'), createContactGroup);
router.put('/groups/:id', authorize('ADMIN'), updateContactGroup);
router.delete('/groups/:id', authorize('ADMIN'), deleteContactGroup);

// ===== Mitarbeiter-Synchronisation (nur Admins) =====
router.post('/sync-employees', authorize('ADMIN'), syncEmployees);

// ===== Kontakte =====
// Lesen: alle authentifizierten Benutzer (sichtbarkeitsgefiltert im Controller)
router.get('/', getAllContacts);
router.get('/:id', getContactById);

// Schreiben: gemäss Modul-Berechtigung der Benutzergruppe (Admins haben immer Zugriff)
router.post('/', requireModuleAccess('contacts', 'canCreate'), createContact);
router.put('/:id', requireModuleAccess('contacts', 'canEdit'), updateContact);
router.delete('/:id', requireModuleAccess('contacts', 'canDelete'), deleteContact);

export default router;
