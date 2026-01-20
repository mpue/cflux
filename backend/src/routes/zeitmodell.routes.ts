import { Router } from 'express';
import { zeitmodellController } from '../controllers/zeitmodell.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Alle Routes erfordern Authentifizierung
router.use(authenticate);

// ==================== Zeitmodelle ====================

// Liste aller Zeitmodelle
router.get('/', zeitmodellController.getAllZeitmodelle);

// Einzelnes Zeitmodell
router.get('/:id', zeitmodellController.getZeitmodellById);

// Neues Zeitmodell erstellen (nur Admin)
router.post('/', requireAdmin, zeitmodellController.createZeitmodell);

// Zeitmodell aktualisieren (nur Admin)
router.put('/:id', requireAdmin, zeitmodellController.updateZeitmodell);

// Zeitmodell löschen (nur Admin)
router.delete('/:id', requireAdmin, zeitmodellController.deleteZeitmodell);

// ==================== Mitarbeiter-Zuweisung ====================

// Zeitmodell einem Mitarbeiter zuweisen (nur Admin)
router.post('/assign', requireAdmin, zeitmodellController.assignToMitarbeiter);

// Zeitmodelle eines Mitarbeiters abrufen
router.get('/mitarbeiter/:mitarbeiterId', zeitmodellController.getMitarbeiterZeitmodelle);

// Zuweisung entfernen (nur Admin)
router.delete('/assign/:id', requireAdmin, zeitmodellController.removeMitarbeiterZeitmodell);

// ==================== Stundensatz-Ermittlung ====================

// Stundensatz für einen bestimmten Zeitpunkt ermitteln
router.get('/stundensatz/:mitarbeiterId', zeitmodellController.getStundensatz);

// Arbeitszeitabrechnung berechnen
router.get('/abrechnung/:mitarbeiterId', zeitmodellController.calculateArbeitszeitabrechnung);

// ==================== Statistiken ====================

// Statistiken abrufen (nur Admin)
router.get('/stats/overview', requireAdmin, zeitmodellController.getStatistics);

export default router;
