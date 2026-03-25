import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


export const dashboardLayoutController = {
  // Get user's dashboard layout
  getMyLayout: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const layout = await prisma.userDashboardLayout.findUnique({
        where: { userId },
      });

      if (!layout) {
        return res.json(null);
      }

      res.json(layout.layoutData);
    } catch (error) {
      console.error('Error getting dashboard layout:', error);
      res.status(500).json({ error: 'Fehler beim Laden des Dashboard-Layouts' });
    }
  },

  // Save/update user's dashboard layout
  saveMyLayout: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const layoutData = req.body;

      // Validate layoutData structure
      if (!layoutData || !layoutData.widgets || !layoutData.layouts) {
        return res.status(400).json({ error: 'Ungültiges Layout-Format' });
      }

      const layout = await prisma.userDashboardLayout.upsert({
        where: { userId },
        update: {
          layoutData,
          updatedAt: new Date(),
        },
        create: {
          userId,
          layoutData,
        },
      });

      res.json({
        message: 'Dashboard-Layout erfolgreich gespeichert',
        layout: layout.layoutData,
      });
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      res.status(500).json({ error: 'Fehler beim Speichern des Dashboard-Layouts' });
    }
  },

  // Reset user's dashboard layout to default
  resetMyLayout: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      await prisma.userDashboardLayout.delete({
        where: { userId },
      });

      res.json({ message: 'Dashboard-Layout erfolgreich zurückgesetzt' });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        // Record not found - that's ok
        return res.json({ message: 'Dashboard-Layout erfolgreich zurückgesetzt' });
      }
      console.error('Error resetting dashboard layout:', error);
      res.status(500).json({ error: 'Fehler beim Zurücksetzen des Dashboard-Layouts' });
    }
  },
};
