import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Alle Nachrichten des Benutzers nach Ordner abrufen
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { folder = 'INBOX' } = req.query;

    const where: any = {
      receiverId: userId,
      receiverFolder: folder
    };

    // Bei SENT Ordner die gesendeten Nachrichten des Benutzers abrufen
    if (folder === 'SENT') {
      where.senderId = userId;
      where.senderFolder = folder;
      delete where.receiverId;
      delete where.receiverFolder;
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        replyTo: {
          select: {
            id: true,
            subject: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Einzelne Nachricht abrufen
export const getMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        OR: [
          { receiverId: userId },
          { senderId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        replyTo: {
          select: {
            id: true,
            subject: true,
            body: true,
            createdAt: true
          }
        },
        replies: {
          select: {
            id: true,
            subject: true,
            createdAt: true,
            isRead: true,
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Nachricht als gelesen markieren, wenn Empfänger sie öffnet
    if (message.receiverId === userId && !message.isRead) {
      await prisma.message.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
};

// Neue Nachricht senden
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { receiverId, subject, body, priority = 'normal', replyToId } = req.body;

    if (!receiverId || !subject || !body) {
      return res.status(400).json({ error: 'Receiver, subject, and body are required' });
    }

    // Prüfen ob Empfänger existiert
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        subject,
        body,
        priority,
        replyToId,
        type: 'USER'
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`[MESSAGE] User ${userId} sent message to ${receiverId}: ${subject}`);
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Systemnachricht senden (nur für Workflows und System)
export const sendSystemMessage = async (
  receiverId: string,
  subject: string,
  body: string,
  type: 'SYSTEM' | 'WORKFLOW' = 'SYSTEM',
  workflowId?: string,
  workflowInstanceId?: string
) => {
  try {
    const message = await prisma.message.create({
      data: {
        receiverId,
        subject,
        body,
        type,
        workflowId,
        workflowInstanceId,
        priority: 'high'
      }
    });

    console.log(`[SYSTEM MESSAGE] Sent to ${receiverId}: ${subject}`);
    return message;
  } catch (error) {
    console.error('Error sending system message:', error);
    throw error;
  }
};

// Nachricht verschieben (Inbox -> Trash, etc.)
export const moveMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { folder } = req.body;

    if (!['INBOX', 'SENT', 'TRASH'].includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder' });
    }

    const message = await prisma.message.findFirst({
      where: {
        id,
        OR: [
          { receiverId: userId },
          { senderId: userId }
        ]
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Update entsprechenden Folder basierend darauf, ob User Sender oder Empfänger ist
    const updateData: any = {};
    if (message.receiverId === userId) {
      updateData.receiverFolder = folder;
    }
    if (message.senderId === userId) {
      updateData.senderFolder = folder;
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: updateData
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error moving message:', error);
    res.status(500).json({ error: 'Failed to move message' });
  }
};

// Nachricht endgültig löschen (aus Papierkorb)
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        OR: [
          { receiverId: userId, receiverFolder: 'TRASH' },
          { senderId: userId, senderFolder: 'TRASH' }
        ]
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or not in trash' });
    }

    // Wenn beide Teilnehmer die Nachricht im Papierkorb haben, komplett löschen
    if (message.receiverFolder === 'TRASH' && message.senderFolder === 'TRASH') {
      await prisma.message.delete({
        where: { id }
      });
    } else {
      // Sonst nur den Folder des Users auf "deleted" setzen
      const updateData: any = {};
      if (message.receiverId === userId) {
        // Soft delete für Empfänger
        updateData.receiverFolder = 'TRASH';
      }
      if (message.senderId === userId) {
        // Soft delete für Sender
        updateData.senderFolder = 'TRASH';
      }
      
      await prisma.message.update({
        where: { id },
        data: updateData
      });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Nachricht als gelesen/ungelesen markieren
export const toggleReadStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { isRead } = req.body;

    const message = await prisma.message.findFirst({
      where: {
        id,
        receiverId: userId
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null
      }
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error updating read status:', error);
    res.status(500).json({ error: 'Failed to update read status' });
  }
};

// Anzahl ungelesener Nachrichten abrufen
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        receiverFolder: 'INBOX',
        isRead: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Alle Benutzer für Message-Empfänger-Auswahl abrufen
export const getMessageRecipients = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        id: {
          not: req.user!.id // Aktuellen Benutzer ausschließen
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
};

export { sendSystemMessage as sendSystemMessageExport };
