import { Request, Response } from 'express';
import { PrismaClient, ReminderLevel, ReminderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Alle Mahnungen abrufen
export const getAllReminders = async (req: Request, res: Response) => {
  try {
    const { status, level, customerId } = req.query;
    
    const where: any = {};
    
    if (status) where.status = status as ReminderStatus;
    if (level) where.level = level as ReminderLevel;
    if (customerId) {
      where.invoice = {
        customerId: customerId as string
      };
    }
    
    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        reminderDate: 'desc'
      }
    });
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

// Einzelne Mahnung abrufen
export const getReminderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            customer: true,
            items: true
          }
        }
      }
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
};

// Mahnungen für eine Rechnung abrufen
export const getRemindersByInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    
    const reminders = await prisma.reminder.findMany({
      where: { invoiceId },
      orderBy: {
        reminderDate: 'asc'
      }
    });
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders by invoice:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

// Neue Mahnung erstellen
export const createReminder = async (req: Request, res: Response) => {
  try {
    const {
      invoiceId,
      level,
      dueDate,
      reminderFee,
      interestAmount,
      interestRate,
      subject,
      message,
      notes
    } = req.body;
    
    // Rechnung prüfen
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Mahnungsnummer generieren
    const year = new Date().getFullYear();
    const lastReminder = await prisma.reminder.findFirst({
      where: {
        reminderNumber: {
          startsWith: `M-${year}-`
        }
      },
      orderBy: {
        reminderNumber: 'desc'
      }
    });
    
    let nextNumber = 1;
    if (lastReminder) {
      const lastNumber = parseInt(lastReminder.reminderNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    const reminderNumber = `M-${year}-${nextNumber.toString().padStart(3, '0')}`;
    
    // Gesamtbetrag berechnen
    const originalAmount = invoice.totalAmount;
    const totalAmount = originalAmount + (reminderFee || 0) + (interestAmount || 0);
    
    const reminder = await prisma.reminder.create({
      data: {
        invoiceId,
        reminderNumber,
        level: level || ReminderLevel.FIRST_REMINDER,
        dueDate: new Date(dueDate),
        originalAmount,
        reminderFee: reminderFee || 0,
        interestAmount: interestAmount || 0,
        totalAmount,
        interestRate: interestRate || 5.0,
        subject,
        message,
        notes
      },
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      }
    });
    
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
};

// Mahnung aktualisieren
export const updateReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      dueDate,
      reminderFee,
      interestAmount,
      interestRate,
      subject,
      message,
      notes,
      sentDate,
      paidDate
    } = req.body;
    
    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (reminderFee !== undefined) updateData.reminderFee = reminderFee;
    if (interestAmount !== undefined) updateData.interestAmount = interestAmount;
    if (interestRate !== undefined) updateData.interestRate = interestRate;
    if (subject) updateData.subject = subject;
    if (message) updateData.message = message;
    if (notes !== undefined) updateData.notes = notes;
    if (sentDate) updateData.sentDate = new Date(sentDate);
    if (paidDate) updateData.paidDate = new Date(paidDate);
    
    // Gesamtbetrag neu berechnen wenn nötig
    if (reminderFee !== undefined || interestAmount !== undefined) {
      const reminder = await prisma.reminder.findUnique({
        where: { id }
      });
      
      if (reminder) {
        updateData.totalAmount = 
          reminder.originalAmount + 
          (reminderFee !== undefined ? reminderFee : reminder.reminderFee) + 
          (interestAmount !== undefined ? interestAmount : reminder.interestAmount);
      }
    }
    
    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      }
    });
    
    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
};

// Mahnung löschen
export const deleteReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.reminder.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
};

// Mahnung versenden (Status ändern)
export const sendReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sentBy } = req.body;
    
    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.SENT,
        sentDate: new Date(),
        sentBy
      },
      include: {
        invoice: {
          include: {
            customer: true
          }
        }
      }
    });
    
    // Rechnungsstatus aktualisieren
    await prisma.invoice.update({
      where: { id: reminder.invoiceId },
      data: {
        status: 'OVERDUE'
      }
    });
    
    res.json(reminder);
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
};

// Mahnung als bezahlt markieren
export const markReminderAsPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.PAID,
        paidDate: new Date()
      },
      include: {
        invoice: true
      }
    });
    
    // Rechnung als bezahlt markieren
    await prisma.invoice.update({
      where: { id: reminder.invoiceId },
      data: {
        status: 'PAID'
      }
    });
    
    res.json(reminder);
  } catch (error) {
    console.error('Error marking reminder as paid:', error);
    res.status(500).json({ error: 'Failed to mark reminder as paid' });
  }
};

// Überfällige Rechnungen ermitteln (für automatische Mahnungen)
export const getOverdueInvoices = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.reminderSettings.findFirst();
    
    if (!settings) {
      return res.status(404).json({ error: 'Reminder settings not found' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['SENT', 'OVERDUE']
        },
        dueDate: {
          lt: today
        }
      },
      include: {
        customer: true,
        reminders: {
          orderBy: {
            reminderDate: 'desc'
          }
        }
      }
    });
    
    // Kategorisieren nach Mahnstufe
    const result = overdueInvoices.map(invoice => {
      const daysPastDue = Math.floor((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const reminderCount = invoice.reminders.length;
      const lastReminder = invoice.reminders[0];
      
      let suggestedLevel: ReminderLevel = ReminderLevel.FIRST_REMINDER;
      let suggestedFee = settings.firstReminderFee;
      let waitDays = settings.firstReminderDays;
      
      if (reminderCount === 0) {
        suggestedLevel = ReminderLevel.FIRST_REMINDER;
        suggestedFee = settings.firstReminderFee;
        waitDays = settings.firstReminderDays;
      } else if (reminderCount === 1) {
        suggestedLevel = ReminderLevel.SECOND_REMINDER;
        suggestedFee = settings.secondReminderFee;
        waitDays = settings.secondReminderDays;
      } else {
        suggestedLevel = ReminderLevel.FINAL_REMINDER;
        suggestedFee = settings.finalReminderFee;
        waitDays = settings.finalReminderDays;
      }
      
      const shouldSendReminder = daysPastDue >= waitDays;
      
      return {
        ...invoice,
        daysPastDue,
        reminderCount,
        lastReminder,
        suggestedLevel,
        suggestedFee,
        shouldSendReminder
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    res.status(500).json({ error: 'Failed to fetch overdue invoices' });
  }
};

// Mahneinstellungen abrufen
export const getReminderSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.reminderSettings.findFirst();
    
    if (!settings) {
      // Standard-Einstellungen erstellen
      settings = await prisma.reminderSettings.create({
        data: {}
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching reminder settings:', error);
    res.status(500).json({ error: 'Failed to fetch reminder settings' });
  }
};

// Mahneinstellungen aktualisieren
export const updateReminderSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const settings = await prisma.reminderSettings.update({
      where: { id },
      data: req.body
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    res.status(500).json({ error: 'Failed to update reminder settings' });
  }
};

// Statistiken abrufen
export const getReminderStats = async (req: Request, res: Response) => {
  try {
    const totalReminders = await prisma.reminder.count();
    
    const remindersByStatus = await prisma.reminder.groupBy({
      by: ['status'],
      _count: true
    });
    
    const remindersByLevel = await prisma.reminder.groupBy({
      by: ['level'],
      _count: true
    });
    
    const totalReminderFees = await prisma.reminder.aggregate({
      _sum: {
        reminderFee: true,
        interestAmount: true
      }
    });
    
    res.json({
      totalReminders,
      byStatus: remindersByStatus,
      byLevel: remindersByLevel,
      totalFees: totalReminderFees._sum.reminderFee || 0,
      totalInterest: totalReminderFees._sum.interestAmount || 0
    });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({ error: 'Failed to fetch reminder stats' });
  }
};
