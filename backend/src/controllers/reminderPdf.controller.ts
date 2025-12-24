import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateReminderPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            customer: true,
            items: true,
            template: true
          }
        }
      }
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const invoice = reminder.invoice;
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // PDF erstellen
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: `Mahnung ${reminder.reminderNumber}`,
        Author: invoice.template?.companyName || 'Ihre Firma'
      }
    });

    // Response Header setzen
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=mahnung-${reminder.reminderNumber}.pdf`
    );

    doc.pipe(res);

    // Firmendaten
    const company = {
      name: invoice.template?.companyName || 'Ihre Firma',
      street: invoice.template?.companyStreet || '',
      zip: invoice.template?.companyZip || '',
      city: invoice.template?.companyCity || '',
      country: invoice.template?.companyCountry || 'Schweiz',
      phone: invoice.template?.companyPhone || '',
      email: invoice.template?.companyEmail || '',
      website: invoice.template?.companyWebsite || '',
      taxId: invoice.template?.companyTaxId || '',
      iban: invoice.template?.companyIban || '',
      bank: invoice.template?.companyBank || ''
    };

    // Kopfzeile - Firma
    doc.fontSize(10);
    doc.font('Helvetica-Bold');
    doc.text(company.name, 50, 50);
    doc.font('Helvetica');
    if (company.street) doc.text(company.street);
    doc.text(`${company.zip} ${company.city}`);
    if (company.phone) doc.text(`Tel: ${company.phone}`);
    if (company.email) doc.text(`E-Mail: ${company.email}`);

    // Kundendaten
    doc.fontSize(10);
    const customerY = 150;
    doc.font('Helvetica-Bold');
    doc.text(invoice.customer.name, 50, customerY);
    doc.font('Helvetica');
    if (invoice.customer.address) doc.text(invoice.customer.address);
    doc.text(`${invoice.customer.zipCode || ''} ${invoice.customer.city || ''}`);
    if (invoice.customer.country && invoice.customer.country !== 'Schweiz') {
      doc.text(invoice.customer.country);
    }

    // Mahntitel
    let reminderTitle = '';
    switch (reminder.level) {
      case 'FIRST_REMINDER':
        reminderTitle = '1. MAHNUNG';
        break;
      case 'SECOND_REMINDER':
        reminderTitle = '2. MAHNUNG';
        break;
      case 'FINAL_REMINDER':
        reminderTitle = '3. MAHNUNG / LETZTE MAHNUNG';
        break;
    }

    doc.fontSize(16);
    doc.font('Helvetica-Bold');
    doc.text(reminderTitle, 50, 250);
    doc.font('Helvetica');

    // Mahninformationen
    doc.fontSize(10);
    const infoY = 280;
    doc.text(`Mahnnummer:`, 50, infoY);
    doc.text(reminder.reminderNumber, 200, infoY);
    
    doc.text(`Mahndatum:`, 50, infoY + 15);
    doc.text(new Date(reminder.reminderDate).toLocaleDateString('de-CH'), 200, infoY + 15);
    
    doc.text(`Rechnungsnummer:`, 50, infoY + 30);
    doc.text(invoice.invoiceNumber, 200, infoY + 30);
    
    doc.text(`Rechnungsdatum:`, 50, infoY + 45);
    doc.text(new Date(invoice.invoiceDate).toLocaleDateString('de-CH'), 200, infoY + 45);
    
    doc.text(`Ursprünglich fällig:`, 50, infoY + 60);
    doc.text(new Date(invoice.dueDate).toLocaleDateString('de-CH'), 200, infoY + 60);
    
    doc.text(`Neue Zahlungsfrist:`, 50, infoY + 75);
    doc.font('Helvetica-Bold');
    doc.text(new Date(reminder.dueDate).toLocaleDateString('de-CH'), 200, infoY + 75);
    doc.font('Helvetica');

    // Mahntext
    let defaultMessage = '';
    switch (reminder.level) {
      case 'FIRST_REMINDER':
        defaultMessage = 'Trotz Fälligkeit haben wir bisher keine Zahlung erhalten. Wir bitten Sie, den ausstehenden Betrag innerhalb der neuen Zahlungsfrist zu begleichen.';
        break;
      case 'SECOND_REMINDER':
        defaultMessage = 'Leider haben wir trotz unserer ersten Mahnung noch keine Zahlung erhalten. Bitte begleichen Sie den ausstehenden Betrag umgehend, um weitere Maßnahmen zu vermeiden.';
        break;
      case 'FINAL_REMINDER':
        defaultMessage = 'Dies ist unsere letzte Mahnung. Sollten wir bis zum angegebenen Datum keine Zahlung erhalten, werden wir gezwungen sein, rechtliche Schritte einzuleiten und/oder das Inkasso zu beauftragen.';
        break;
    }

    doc.fontSize(10);
    doc.text(reminder.message || defaultMessage, 50, 420, {
      width: 500,
      align: 'justify'
    });

    // Betragsaufstellung
    const tableTop = 500;
    doc.fontSize(11);
    doc.font('Helvetica-Bold');
    doc.text('Offener Betrag:', 50, tableTop);
    doc.font('Helvetica');

    const lineHeight = 20;
    let currentY = tableTop + 25;

    // Ursprünglicher Rechnungsbetrag
    doc.fontSize(10);
    doc.text('Rechnungsbetrag', 50, currentY);
    doc.text(`CHF ${reminder.originalAmount.toFixed(2)}`, 450, currentY, { align: 'right' });
    currentY += lineHeight;

    // Mahngebühr
    if (reminder.reminderFee > 0) {
      doc.text('Mahngebühr', 50, currentY);
      doc.text(`CHF ${reminder.reminderFee.toFixed(2)}`, 450, currentY, { align: 'right' });
      currentY += lineHeight;
    }

    // Verzugszinsen
    if (reminder.interestAmount > 0) {
      doc.text(`Verzugszinsen (${reminder.interestRate}%)`, 50, currentY);
      doc.text(`CHF ${reminder.interestAmount.toFixed(2)}`, 450, currentY, { align: 'right' });
      currentY += lineHeight;
    }

    // Trennlinie
    currentY += 5;
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    // Gesamtbetrag
    doc.fontSize(12);
    doc.font('Helvetica-Bold');
    doc.text('Zu zahlender Gesamtbetrag:', 50, currentY);
    doc.text(`CHF ${reminder.totalAmount.toFixed(2)}`, 450, currentY, { align: 'right' });
    doc.font('Helvetica');

    // Zahlungsinformationen
    if (company.iban) {
      currentY += 40;
      doc.fontSize(11);
      doc.font('Helvetica-Bold');
      doc.text('Zahlungsinformationen:', 50, currentY);
      doc.font('Helvetica');
      currentY += 20;

      doc.fontSize(10);
      doc.text('IBAN:', 50, currentY);
      doc.text(company.iban, 150, currentY);
      currentY += 15;

      if (company.bank) {
        doc.text('Bank:', 50, currentY);
        doc.text(company.bank, 150, currentY);
        currentY += 15;
      }

      doc.text('Zahlungsgrund:', 50, currentY);
      doc.text(`${reminder.reminderNumber} / ${invoice.invoiceNumber}`, 150, currentY);
    }

    // Fußzeile
    const footerY = 750;
    doc.fontSize(8);
    doc.text(
      `Bei Fragen kontaktieren Sie uns bitte unter ${company.phone || company.email}`,
      50,
      footerY,
      { align: 'center', width: 500 }
    );

    if (company.taxId) {
      doc.text(
        `UID: ${company.taxId}`,
        50,
        footerY + 15,
        { align: 'center', width: 500 }
      );
    }

    doc.end();
  } catch (error) {
    console.error('Error generating reminder PDF:', error);
    res.status(500).json({ error: 'Failed to generate reminder PDF' });
  }
};
