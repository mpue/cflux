import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';

const prisma = new PrismaClient();

export const generateInvoicePdf = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rechnung_${invoice.invoiceNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Company header (sender)
    doc.fontSize(10)
       .text('Ihr Firmenname', 50, 50)
       .text('Musterstrasse 123', 50, 65)
       .text('8000 Zürich', 50, 80)
       .text('Tel: +41 44 123 45 67', 50, 95)
       .text('Email: info@firma.ch', 50, 110);

    // Customer address
    const customerY = 180;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(invoice.customer.name, 50, customerY);
    
    let addressY = customerY + 15;
    doc.font('Helvetica');
    
    if (invoice.customer.contactPerson) {
      doc.text(`z.H. ${invoice.customer.contactPerson}`, 50, addressY);
      addressY += 15;
    }
    
    if (invoice.customer.address) {
      doc.text(invoice.customer.address, 50, addressY);
      addressY += 15;
    }
    
    if (invoice.customer.zipCode && invoice.customer.city) {
      doc.text(`${invoice.customer.zipCode} ${invoice.customer.city}`, 50, addressY);
      addressY += 15;
    }
    
    if (invoice.customer.country && invoice.customer.country !== 'Schweiz') {
      doc.text(invoice.customer.country, 50, addressY);
      addressY += 15;
    }

    // Invoice details (right side)
    const detailsX = 350;
    doc.fontSize(10)
       .text('Rechnung Nr.:', detailsX, customerY, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${invoice.invoiceNumber}`, { align: 'right' });
    
    doc.font('Helvetica')
       .text('Rechnungsdatum:', detailsX, customerY + 15, { continued: true })
       .text(` ${new Date(invoice.invoiceDate).toLocaleDateString('de-CH')}`, { align: 'right' });
    
    doc.text('Fällig am:', detailsX, customerY + 30, { continued: true })
       .text(` ${new Date(invoice.dueDate).toLocaleDateString('de-CH')}`, { align: 'right' });

    if (invoice.customer.taxId) {
      doc.text('UID Kunde:', detailsX, customerY + 45, { continued: true })
         .text(` ${invoice.customer.taxId}`, { align: 'right' });
    }

    // Invoice title
    const titleY = addressY + 30;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('RECHNUNG', 50, titleY);

    // Table header
    const tableTop = titleY + 40;
    const posX = 50;
    const descX = 80;
    const qtyX = 350;
    const unitX = 395;
    const priceX = 440;
    const totalX = 500;

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Pos', posX, tableTop)
       .text('Beschreibung', descX, tableTop)
       .text('Menge', qtyX, tableTop)
       .text('Einheit', unitX, tableTop)
       .text('Preis', priceX, tableTop)
       .text('Betrag', totalX, tableTop);

    // Draw line under header
    doc.moveTo(50, tableTop + 15)
       .lineTo(545, tableTop + 15)
       .stroke();

    // Table rows
    let currentY = tableTop + 25;
    doc.font('Helvetica')
       .fontSize(9);

    invoice.items.forEach((item, index) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc.text(item.position.toString(), posX, currentY)
         .text(item.description, descX, currentY, { width: 260 });
      
      const descHeight = doc.heightOfString(item.description, { width: 260 });
      
      doc.text(item.quantity.toString(), qtyX, currentY, { width: 40, align: 'right' })
         .text(item.unit, unitX, currentY)
         .text(`CHF ${item.unitPrice.toFixed(2)}`, priceX, currentY, { width: 55, align: 'right' })
         .text(`CHF ${item.totalPrice.toFixed(2)}`, totalX, currentY, { width: 55, align: 'right' });

      currentY += Math.max(descHeight, 15) + 10;
    });

    // Draw line before totals
    currentY += 10;
    doc.moveTo(350, currentY)
       .lineTo(545, currentY)
       .stroke();

    // Totals
    currentY += 15;
    doc.fontSize(10)
       .font('Helvetica')
       .text('Zwischensumme:', 350, currentY)
       .text(`CHF ${invoice.subtotal.toFixed(2)}`, totalX, currentY, { width: 55, align: 'right' });

    currentY += 18;
    doc.text(`MwSt ${invoice.items[0]?.vatRate || 7.7}%:`, 350, currentY)
       .text(`CHF ${invoice.vatAmount.toFixed(2)}`, totalX, currentY, { width: 55, align: 'right' });

    currentY += 20;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Gesamtbetrag:', 350, currentY)
       .text(`CHF ${invoice.totalAmount.toFixed(2)}`, totalX, currentY, { width: 55, align: 'right' });

    // Payment information
    currentY += 40;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Zahlungsinformationen:', 50, currentY);

    currentY += 20;
    doc.font('Helvetica')
       .text('Zahlbar innert 30 Tagen netto.', 50, currentY)
       .text('Bank: Musterbank AG', 50, currentY + 15)
       .text('IBAN: CH00 0000 0000 0000 0000 0', 50, currentY + 30)
       .text('Kontoinhaber: Ihr Firmenname', 50, currentY + 45);

    // QR code placeholder (Swiss QR-Bill)
    currentY += 80;
    if (currentY < 650) {
      doc.fontSize(8)
         .text('QR-Rechnung folgt separat', 50, currentY, { align: 'center' });
    }

    // Notes
    if (invoice.notes) {
      currentY += 30;
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Bemerkungen:', 50, currentY);
      
      currentY += 18;
      doc.font('Helvetica')
         .fontSize(9)
         .text(invoice.notes, 50, currentY, { width: 495 });
    }

    // Footer
    const footerY = 750;
    doc.fontSize(8)
       .text('Vielen Dank für Ihr Vertrauen!', 50, footerY, { align: 'center', width: 495 })
       .text(`Seite 1`, 50, footerY + 15, { align: 'center', width: 495 });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};
