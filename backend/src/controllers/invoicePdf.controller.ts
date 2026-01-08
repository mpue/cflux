import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import axios from 'axios';

const prisma = new PrismaClient();

export const generateInvoicePdf = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        template: true,
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

    console.log('Invoice Customer Data:', {
      id: invoice.customer.id,
      name: invoice.customer.name,
      address: invoice.customer.address,
      zipCode: invoice.customer.zipCode,
      city: invoice.customer.city,
      country: invoice.customer.country,
      contactPerson: invoice.customer.contactPerson,
      allFields: invoice.customer
    });

    // Get default template if no template is set
    let template = invoice.template;
    if (!template) {
      template = await prisma.invoiceTemplate.findFirst({
        where: { isDefault: true },
      });
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

    // Company header (sender) - use template if available
    const companyName = template?.companyName || 'Ihr Firmenname';
    const companyStreet = template?.companyStreet || 'Musterstrasse 123';
    const companyZipCity = template ? `${template.companyZip} ${template.companyCity}` : '8000 Zürich';
    const companyPhone = template?.companyPhone || 'Tel: +41 44 123 45 67';
    const companyEmail = template?.companyEmail || 'Email: info@firma.ch';
    const primaryColor = template?.primaryColor || '#2563eb';
    
    // Add header text if available
    let headerStartY = 50;
    if (template?.headerText) {
      doc.fontSize(10)
         .fillColor(primaryColor)
         .text(template.headerText, 50, headerStartY, { width: 495 });
      headerStartY += 30;
      doc.fillColor('#000000'); // Reset to black
    }
    
    // Add logo if available and enabled
    if (template?.showLogo && template?.logoUrl) {
      try {
        // Parse logo position from template
        let logoX = 50;
        let logoY = headerStartY;
        let logoWidth = 150;
        let logoHeight = 60;
        
        if (template.logoPosition) {
          try {
            const position = JSON.parse(template.logoPosition);
            // Scale position from preview coordinates (600px width) to PDF coordinates (A4 ~ 545px)
            logoX = 50 + (position.x * 0.9);
            logoY = headerStartY + (position.y * 0.5);
            logoWidth = position.width * 0.9;
            logoHeight = position.height * 0.9;
          } catch (e) {
            console.warn('Failed to parse logo position, using defaults');
          }
        }
        
        // Try to download and embed logo
        if (template.logoUrl.startsWith('http')) {
          const response = await axios.get(template.logoUrl, { 
            responseType: 'arraybuffer',
            timeout: 5000 
          });
          const buffer = Buffer.from(response.data);
          doc.image(buffer, logoX, logoY, { 
            width: logoWidth,
            height: logoHeight,
            fit: [logoWidth, logoHeight]
          });
        } else {
          // Local file path
          doc.image(template.logoUrl, logoX, logoY, { 
            width: logoWidth,
            height: logoHeight,
            fit: [logoWidth, logoHeight]
          });
        }
        
        // Adjust header start based on logo position
        headerStartY = Math.max(headerStartY, logoY + logoHeight + 20);
      } catch (error) {
        console.error('Failed to load logo:', error);
        // Continue without logo
      }
    }
    
    // Company address block
    doc.fontSize(10)
       .fillColor('#000000')
       .text(companyName, 50, headerStartY)
       .text(companyStreet, 50, headerStartY + 15)
       .text(companyZipCity, 50, headerStartY + 30)
       .text(companyPhone, 50, headerStartY + 45)
       .text(companyEmail, 50, headerStartY + 60);

    // Calculate customer address position - ensure it's below company address and logo
    const companyAddressEnd = headerStartY + 75;
    const customerY = companyAddressEnd + 55; // Add space between company and customer
    
    console.log('PDF Layout Debug:', {
      headerStartY,
      companyAddressEnd,
      customerY,
      customerName: invoice.customer.name,
      customerAddress: invoice.customer.address,
      customerZip: invoice.customer.zipCode,
      customerCity: invoice.customer.city
    });
    
    // Customer address
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(invoice.customer.name, 50, customerY);
    
    let addressY = customerY + 15;
    doc.font('Helvetica')
       .fontSize(10);
    
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
       .fillColor(primaryColor)
       .text('Rechnung Nr.:', detailsX, customerY, { continued: true })
       .font('Helvetica-Bold')
       .text(` ${invoice.invoiceNumber}`, { align: 'right' });
    
    doc.font('Helvetica')
       .fillColor('#000000')
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
       .fillColor(primaryColor)
       .text('RECHNUNG', 50, titleY);
    
    // Intro text from template
    if (template?.introText) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text(template.introText, 50, titleY + 25, { width: 495 });
    }

    // Table header
    const tableTop = titleY + (template?.introText ? 60 : 40);
    const posX = 50;
    const descX = 80;
    const qtyX = 350;
    const unitX = 395;
    const priceX = 440;
    const totalX = 500;

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Pos', posX, tableTop)
       .text('Beschreibung', descX, tableTop)
       .text('Menge', qtyX, tableTop)
       .text('Einheit', unitX, tableTop)
       .text('Preis', priceX, tableTop)
       .text('Betrag', totalX, tableTop);

    // Draw line under header
    doc.strokeColor(primaryColor)
       .moveTo(50, tableTop + 15)
       .lineTo(545, tableTop + 15)
       .stroke()
       .strokeColor('#000000');

    // Table rows
    let currentY = tableTop + 25;
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#000000');

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
       .fillColor(primaryColor)
       .text('Gesamtbetrag:', 350, currentY)
       .text(`CHF ${invoice.totalAmount.toFixed(2)}`, totalX, currentY, { width: 55, align: 'right' });
    
    doc.fillColor('#000000'); // Reset color

    // Payment information
    currentY += 40;
    
    if (template?.showPaymentInfo !== false) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Zahlungsinformationen:', 50, currentY);

      currentY += 20;
      const paymentTerms = template?.paymentTermsText || 'Zahlbar innert 30 Tagen netto.';
      const bank = template?.companyBank || 'Musterbank AG';
      const iban = template?.companyIban || 'CH00 0000 0000 0000 0000 0';
      
      doc.font('Helvetica')
         .text(paymentTerms, 50, currentY);
      
      currentY += 15;
      doc.text(`Bank: ${bank}`, 50, currentY)
         .text(`IBAN: ${iban}`, 50, currentY + 15)
         .text(`Kontoinhaber: ${companyName}`, 50, currentY + 30);
      
      currentY += 45;
    }

    // QR code placeholder (Swiss QR-Bill)
    currentY += 35;
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
         .fillColor(primaryColor)
         .text('Bemerkungen:', 50, currentY);
      
      currentY += 18;
      doc.font('Helvetica')
         .fillColor('#000000')
         .fontSize(9)
         .text(invoice.notes, 50, currentY, { width: 495 });
    }

    // Footer
    const footerY = 750;
    const footerText = template?.footerText || 'Vielen Dank für Ihr Vertrauen!';
    
    doc.fontSize(8)
       .fillColor('#666666')
       .text(footerText, 50, footerY, { align: 'center', width: 495 })
       .text(`Seite 1`, 50, footerY + 15, { align: 'center', width: 495 });
    
    // Show tax ID in footer if enabled
    if (template?.showTaxId && template?.companyTaxId) {
      doc.text(`UID: ${template.companyTaxId}`, 50, footerY + 30, { align: 'center', width: 495 });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};
