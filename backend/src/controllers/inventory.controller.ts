import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const inventoryController = {
  // Get all inventory items
  getAllInventoryItems: async (req: AuthRequest, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      
      const items = await prisma.inventoryItem.findMany({
        where: includeInactive ? {} : {
          article: {
            isActive: true
          }
        },
        include: {
          article: {
            include: {
              articleGroup: true
            }
          },
          movements: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5  // Letzte 5 Bewegungen
          }
        },
        orderBy: {
          article: {
            name: 'asc'
          }
        }
      });

      res.json(items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Lagerbestände' });
    }
  },

  // Get single inventory item by ID
  getInventoryItemById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
          article: {
            include: {
              articleGroup: true
            }
          },
          movements: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!item) {
        return res.status(404).json({ message: 'Lagerbestand nicht gefunden' });
      }

      res.json(item);
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      res.status(500).json({ message: 'Fehler beim Laden des Lagerbestands' });
    }
  },

  // Create or update inventory item
  upsertInventoryItem: async (req: AuthRequest, res: Response) => {
    try {
      const { articleId, quantity, minQuantity, location, notes } = req.body;

      if (!articleId) {
        return res.status(400).json({ message: 'Artikel-ID ist erforderlich' });
      }

      // Check if article exists
      const article = await prisma.article.findUnique({
        where: { id: articleId }
      });

      if (!article) {
        return res.status(404).json({ message: 'Artikel nicht gefunden' });
      }

      const item = await prisma.inventoryItem.upsert({
        where: { articleId },
        create: {
          articleId,
          quantity: quantity || 0,
          minQuantity: minQuantity || 0,
          location,
          notes,
          lastRestocked: quantity > 0 ? new Date() : undefined
        },
        update: {
          quantity,
          minQuantity,
          location,
          notes
        },
        include: {
          article: {
            include: {
              articleGroup: true
            }
          }
        }
      });

      res.json(item);
    } catch (error: any) {
      console.error('Error upserting inventory item:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Ein Lagerbestand für diesen Artikel existiert bereits' });
      }
      res.status(500).json({ message: 'Fehler beim Speichern des Lagerbestands' });
    }
  },

  // Record inventory movement
  recordMovement: async (req: AuthRequest, res: Response) => {
    try {
      const { inventoryItemId, type, quantity, reason } = req.body;
      const userId = req.user?.id;

      if (!inventoryItemId || !type || quantity === undefined) {
        return res.status(400).json({ message: 'Fehlende erforderliche Felder' });
      }

      if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
        return res.status(400).json({ message: 'Ungültiger Bewegungstyp. Erlaubt: IN, OUT, ADJUSTMENT' });
      }

      // Get current inventory item
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId }
      });

      if (!inventoryItem) {
        return res.status(404).json({ message: 'Lagerbestand nicht gefunden' });
      }

      // Calculate new quantity
      let newQuantity = inventoryItem.quantity;
      if (type === 'IN') {
        newQuantity += quantity;
      } else if (type === 'OUT') {
        newQuantity -= quantity;
        if (newQuantity < 0) {
          return res.status(400).json({ message: 'Bestand kann nicht negativ werden' });
        }
      } else if (type === 'ADJUSTMENT') {
        newQuantity = quantity;
      }

      // Create movement and update inventory in transaction
      const [movement] = await prisma.$transaction([
        prisma.inventoryMovement.create({
          data: {
            inventoryItemId,
            type,
            quantity,
            reason,
            userId: userId!
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        prisma.inventoryItem.update({
          where: { id: inventoryItemId },
          data: {
            quantity: newQuantity,
            lastRestocked: type === 'IN' ? new Date() : inventoryItem.lastRestocked
          }
        })
      ]);

      res.json(movement);
    } catch (error) {
      console.error('Error recording movement:', error);
      res.status(500).json({ message: 'Fehler beim Erfassen der Bewegung' });
    }
  },

  // Get low stock items
  getLowStockItems: async (req: AuthRequest, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany({
        where: {
          AND: [
            {
              article: {
                isActive: true
              }
            },
            {
              OR: [
                {
                  quantity: {
                    lte: prisma.inventoryItem.fields.minQuantity
                  }
                }
              ]
            }
          ]
        },
        include: {
          article: {
            include: {
              articleGroup: true
            }
          }
        }
      });

      // Filter in application since Prisma doesn't support field comparison in where clause
      const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);

      res.json(lowStockItems);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Artikel mit niedrigem Bestand' });
    }
  },

  // Delete inventory item
  deleteInventoryItem: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.inventoryItem.delete({
        where: { id }
      });

      res.json({ message: 'Lagerbestand erfolgreich gelöscht' });
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Lagerbestand nicht gefunden' });
      }
      res.status(500).json({ message: 'Fehler beim Löschen des Lagerbestands' });
    }
  }
};
