import { Request, Response } from 'express';
import { zeitmodellService } from '../services/zeitmodell.service';

export const zeitmodellController = {
  
  // ==================== Zeitmodelle ====================
  
  async getAllZeitmodelle(req: Request, res: Response) {
    try {
      const zeitmodelle = await zeitmodellService.getAllZeitmodelle();
      res.json(zeitmodelle);
    } catch (error: any) {
      console.error('Error fetching zeitmodelle:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Zeitmodelle', error: error.message });
    }
  },

  async getZeitmodellById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const zeitmodell = await zeitmodellService.getZeitmodellById(id);
      
      if (!zeitmodell) {
        return res.status(404).json({ message: 'Zeitmodell nicht gefunden' });
      }
      
      res.json(zeitmodell);
    } catch (error: any) {
      console.error('Error fetching zeitmodell:', error);
      res.status(500).json({ message: 'Fehler beim Laden des Zeitmodells', error: error.message });
    }
  },

  async createZeitmodell(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const data = {
        ...req.body,
        updatedBy: userId,
        gueltigVon: new Date(req.body.gueltigVon),
        gueltigBis: req.body.gueltigBis ? new Date(req.body.gueltigBis) : undefined
      };

      const zeitmodell = await zeitmodellService.createZeitmodell(data);
      res.status(201).json(zeitmodell);
    } catch (error: any) {
      console.error('Error creating zeitmodell:', error);
      res.status(400).json({ message: 'Fehler beim Erstellen des Zeitmodells', error: error.message });
    }
  },

  async updateZeitmodell(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      const data = {
        ...req.body,
        updatedBy: userId,
        gueltigVon: req.body.gueltigVon ? new Date(req.body.gueltigVon) : undefined,
        gueltigBis: req.body.gueltigBis ? new Date(req.body.gueltigBis) : undefined
      };

      const zeitmodell = await zeitmodellService.updateZeitmodell(id, data);
      res.json(zeitmodell);
    } catch (error: any) {
      console.error('Error updating zeitmodell:', error);
      res.status(400).json({ message: 'Fehler beim Aktualisieren des Zeitmodells', error: error.message });
    }
  },

  async deleteZeitmodell(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      await zeitmodellService.deleteZeitmodell(id, userId);
      res.json({ message: 'Zeitmodell erfolgreich gelöscht' });
    } catch (error: any) {
      console.error('Error deleting zeitmodell:', error);
      res.status(400).json({ message: 'Fehler beim Löschen des Zeitmodells', error: error.message });
    }
  },

  // ==================== Mitarbeiter-Zuweisung ====================

  async assignToMitarbeiter(req: Request, res: Response) {
    try {
      const data = {
        ...req.body,
        gueltigVon: new Date(req.body.gueltigVon),
        gueltigBis: req.body.gueltigBis ? new Date(req.body.gueltigBis) : undefined
      };

      const assignment = await zeitmodellService.assignZeitmodellToMitarbeiter(data);
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error('Error assigning zeitmodell:', error);
      res.status(400).json({ message: 'Fehler beim Zuweisen des Zeitmodells', error: error.message });
    }
  },

  async getMitarbeiterZeitmodelle(req: Request, res: Response) {
    try {
      const { mitarbeiterId } = req.params;
      const assignments = await zeitmodellService.getMitarbeiterZeitmodelle(mitarbeiterId);
      res.json(assignments);
    } catch (error: any) {
      console.error('Error fetching mitarbeiter zeitmodelle:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Zeitmodelle', error: error.message });
    }
  },

  async removeMitarbeiterZeitmodell(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await zeitmodellService.removeMitarbeiterZeitmodell(id);
      res.json({ message: 'Zuweisung erfolgreich entfernt' });
    } catch (error: any) {
      console.error('Error removing zeitmodell assignment:', error);
      res.status(400).json({ message: 'Fehler beim Entfernen der Zuweisung', error: error.message });
    }
  },

  // ==================== Stundensatz-Ermittlung ====================

  async getStundensatz(req: Request, res: Response) {
    try {
      const { mitarbeiterId } = req.params;
      const { datum, uhrzeit } = req.query;

      if (!datum || !uhrzeit) {
        return res.status(400).json({ message: 'Datum und Uhrzeit sind erforderlich' });
      }

      const result = await zeitmodellService.getStundensatz(
        mitarbeiterId,
        new Date(datum as string),
        uhrzeit as string
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error getting stundensatz:', error);
      res.status(400).json({ message: 'Fehler beim Ermitteln des Stundensatzes', error: error.message });
    }
  },

  async calculateArbeitszeitabrechnung(req: Request, res: Response) {
    try {
      const { mitarbeiterId } = req.params;
      const { von, bis } = req.query;

      if (!von || !bis) {
        return res.status(400).json({ message: 'Von und Bis Datum sind erforderlich' });
      }

      const result = await zeitmodellService.calculateArbeitszeitabrechnung(
        mitarbeiterId,
        new Date(von as string),
        new Date(bis as string)
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error calculating abrechnung:', error);
      res.status(400).json({ message: 'Fehler bei der Arbeitszeitabrechnung', error: error.message });
    }
  },

  // ==================== Statistiken ====================

  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await zeitmodellService.getZeitmodellStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Statistiken', error: error.message });
    }
  }
};
