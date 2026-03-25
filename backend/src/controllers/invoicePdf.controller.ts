import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth';
import axios from 'axios';
import path from 'path';
import fs from 'fs';


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

    // Load system settings for currency
    const systemSettings = await prisma.systemSettings.findFirst();
    const currency = systemSettings?.currency || 'CHF';

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

    // Create PDF document with enough bottom margin for footer
    const pageWidth = 595.28; // A4
    const pageHeight = 841.89; // A4
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 40;
    const marginBottom = 60; // Reserve space for footer
    const contentWidth = pageWidth - marginLeft - marginRight;
    const footerY = pageHeight - marginBottom + 10; // Footer position
    const maxContentY = footerY - 15; // Max Y before we need a new page

    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight },
      bufferPages: true,
      autoFirstPage: true
    });

    // Set response headers
    const filename = invoice.documentType === 'QUOTE' 
      ? `Angebot_${invoice.invoiceNumber}.pdf`
      : `Rechnung_${invoice.invoiceNumber}.pdf`;
    
    // Use inline disposition for preview (browser embeds PDF), attachment for download
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper: draw footer on current page
    const drawFooter = () => {
      const footerText = template?.footerText || 'Vielen Dank für Ihr Vertrauen!';
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#666666')
         .text(footerText, marginLeft, footerY, { align: 'center', width: contentWidth });
      if (template?.showTaxId && template?.companyTaxId) {
        doc.text(`UID: ${template.companyTaxId}`, marginLeft, footerY + 12, { align: 'center', width: contentWidth });
      }
      doc.fillColor('#000000');
    };

    // Company header (sender) - use template if available
    const companyName = template?.companyName || 'Ihr Firmenname';
    const companyStreet = template?.companyStreet || 'Musterstrasse 123';
    const companyZipCity = template ? `${template.companyZip} ${template.companyCity}` : '8000 Zürich';
    const companyPhone = template?.companyPhone || 'Tel: +41 44 123 45 67';
    const companyEmail = template?.companyEmail || 'Email: info@firma.ch';
    const primaryColor = template?.primaryColor || '#2563eb';
    
    // Add header text if available
    let headerStartY = marginTop;
    if (template?.headerText) {
      doc.fontSize(9)
         .fillColor(primaryColor)
         .text(template.headerText, marginLeft, headerStartY, { width: contentWidth });
      headerStartY += 20;
      doc.fillColor('#000000');
    }
    
    // Add logo if available and enabled
    if (template?.showLogo && template?.logoUrl) {
      try {
        let logoX = marginLeft;
        let logoY = headerStartY;
        let logoWidth = 130;
        let logoHeight = 50;
        
        if (template.logoPosition) {
          try {
            const position = JSON.parse(template.logoPosition);
            logoX = marginLeft + (position.x * 0.9);
            logoY = headerStartY + (position.y * 0.5);
            logoWidth = position.width * 0.9;
            logoHeight = position.height * 0.9;
          } catch (e) {
            console.warn('Failed to parse logo position, using defaults');
          }
        }
        
        if (template.logoUrl.startsWith('http')) {
          const response = await axios.get(template.logoUrl, { 
            responseType: 'arraybuffer',
            timeout: 5000 
          });
          const buffer = Buffer.from(response.data);
          doc.image(buffer, logoX, logoY, { fit: [logoWidth, logoHeight] });
        } else {
          let logoPath = template.logoUrl;
          if (logoPath.startsWith('/uploads/')) {
            logoPath = path.join(__dirname, '../..', logoPath);
          }
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, logoX, logoY, { fit: [logoWidth, logoHeight] });
          }
        }
        
        headerStartY = Math.max(headerStartY, logoY + logoHeight + 10);
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    }
    
    // Company address block (left side, compact)
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#000000')
       .text(companyName, marginLeft, headerStartY)
       .text(companyStreet, marginLeft, headerStartY + 12)
       .text(companyZipCity, marginLeft, headerStartY + 24)
       .text(companyPhone, marginLeft, headerStartY + 36)
       .text(companyEmail, marginLeft, headerStartY + 48);

    // Invoice details (right side, same height as company address)
    const detailsX = 350;
    const documentLabel = invoice.documentType === 'QUOTE' ? 'Angebot Nr.' : 'Rechnung Nr.';
    const dateLabel = invoice.documentType === 'QUOTE' ? 'Angebotsdatum:' : 'Rechnungsdatum:';
    
    doc.fontSize(9)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(`${documentLabel} ${invoice.invoiceNumber}`, detailsX, headerStartY, { width: contentWidth - (detailsX - marginLeft), align: 'right' });
    
    doc.font('Helvetica')
       .fillColor('#000000')
       .text(`${dateLabel} ${new Date(invoice.invoiceDate).toLocaleDateString('de-CH')}`, detailsX, headerStartY + 14, { width: contentWidth - (detailsX - marginLeft), align: 'right' });
    
    let detailLine = 2;
    if (invoice.documentType === 'QUOTE' && invoice.validUntil) {
      doc.text(`Gültig bis: ${new Date(invoice.validUntil).toLocaleDateString('de-CH')}`, detailsX, headerStartY + 14 * (++detailLine - 1), { width: contentWidth - (detailsX - marginLeft), align: 'right' });
    } else if (invoice.documentType === 'INVOICE' && invoice.dueDate) {
      doc.text(`Fällig am: ${new Date(invoice.dueDate).toLocaleDateString('de-CH')}`, detailsX, headerStartY + 14 * (++detailLine - 1), { width: contentWidth - (detailsX - marginLeft), align: 'right' });
    }

    if (invoice.customer.taxId) {
      doc.text(`UID Kunde: ${invoice.customer.taxId}`, detailsX, headerStartY + 14 * (++detailLine - 1), { width: contentWidth - (detailsX - marginLeft), align: 'right' });
    }

    // Customer address (below company address)
    const customerY = headerStartY + 70;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(invoice.customer.name, marginLeft, customerY);
    
    let addressY = customerY + 14;
    doc.font('Helvetica').fontSize(9);
    
    if (invoice.customer.contactPerson) {
      doc.text(`z.H. ${invoice.customer.contactPerson}`, marginLeft, addressY);
      addressY += 13;
    }
    if (invoice.customer.address) {
      doc.text(invoice.customer.address, marginLeft, addressY);
      addressY += 13;
    }
    if (invoice.customer.zipCode && invoice.customer.city) {
      doc.text(`${invoice.customer.zipCode} ${invoice.customer.city}`, marginLeft, addressY);
      addressY += 13;
    }
    if (invoice.customer.country && invoice.customer.country !== 'Schweiz') {
      doc.text(invoice.customer.country, marginLeft, addressY);
      addressY += 13;
    }

    // Invoice title
    const titleY = addressY + 15;
    const documentTitle = invoice.documentType === 'QUOTE' ? 'ANGEBOT' : 'RECHNUNG';
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text(documentTitle, marginLeft, titleY);
    
    let currentY = titleY + 22;
    
    // Intro text from template
    if (template?.introText) {
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#000000')
         .text(template.introText, marginLeft, currentY, { width: contentWidth });
      currentY += doc.heightOfString(template.introText, { width: contentWidth }) + 8;
    }

    // Table columns - adjusted for proper alignment
    const posX = marginLeft;
    const descX = 75;
    const descWidth = 230;
    const qtyX = 310;
    const qtyWidth = 40;
    const unitX = 355;
    const unitWidth = 40;
    const priceX = 395;
    const priceWidth = 70;
    const totalX = 470;
    const totalWidth = 75;

    // Table header
    const tableTop = currentY;
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Pos', posX, tableTop, { width: 25 })
       .text('Beschreibung', descX, tableTop, { width: descWidth })
       .text('Menge', qtyX, tableTop, { width: qtyWidth, align: 'right' })
       .text('Einheit', unitX, tableTop, { width: unitWidth })
       .text(`Preis (${currency})`, priceX, tableTop, { width: priceWidth, align: 'right' })
       .text(`Betrag (${currency})`, totalX, tableTop, { width: totalWidth, align: 'right' });

    // Draw line under header
    doc.strokeColor(primaryColor)
       .lineWidth(0.5)
       .moveTo(marginLeft, tableTop + 12)
       .lineTo(pageWidth - marginRight, tableTop + 12)
       .stroke()
       .strokeColor('#000000');

    // Table rows
    currentY = tableTop + 18;
    doc.font('Helvetica').fontSize(8).fillColor('#000000');

    invoice.items.forEach((item) => {
      // Calculate the estimated height needed for this item
      const estimatedItemHeight = 20; // Realistic estimate for single line item
      
      // Check if we need a new page - be generous with space (leave 100px for footer area)
      const maxY = pageHeight - 100; // ~740px -> more content fits on page
      if (currentY + estimatedItemHeight > maxY) {
        doc.addPage();
        currentY = marginTop;
        
        // Redraw table header on new page
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text('Pos', posX, currentY, { width: 25 })
           .text('Beschreibung', descX, currentY, { width: descWidth })
           .text('Menge', qtyX, currentY, { width: qtyWidth, align: 'right' })
           .text('Einheit', unitX, currentY, { width: unitWidth })
           .text(`Preis (${currency})`, priceX, currentY, { width: priceWidth, align: 'right' })
           .text(`Betrag (${currency})`, totalX, currentY, { width: totalWidth, align: 'right' });
        
        // Draw line under header
        doc.strokeColor(primaryColor)
           .lineWidth(0.5)
           .moveTo(marginLeft, currentY + 12)
           .lineTo(pageWidth - marginRight, currentY + 12)
           .stroke()
           .strokeColor('#000000');
        
        currentY += 18;
      }

      const startY = currentY;
      
      // Position number
      doc.font('Helvetica').fontSize(8).fillColor('#000000')
         .text(item.position.toString(), posX, currentY, { width: 25 });
      
      // Description
      let descHeight = 0;
      let descY = currentY;
      
      if (item.article) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
        const nameHeight = doc.heightOfString(item.article.name, { width: descWidth });
        doc.text(item.article.name, descX, descY, { width: descWidth });
        descY += nameHeight;
        
        if (item.article.description) {
          doc.font('Helvetica').fontSize(7).fillColor('#666666');
          const articleDescHeight = doc.heightOfString(item.article.description, { width: descWidth });
          doc.text(item.article.description, descX, descY, { width: descWidth });
          descHeight = nameHeight + articleDescHeight;
        } else {
          descHeight = nameHeight;
        }
        doc.font('Helvetica').fontSize(8).fillColor('#000000');
      } else {
        doc.font('Helvetica').fontSize(8).fillColor('#000000');
        descHeight = doc.heightOfString(item.description, { width: descWidth });
        doc.text(item.description, descX, descY, { width: descWidth });
      }
      
      // Numeric columns - aligned with first line, NO "CHF" prefix
      doc.font('Helvetica').fontSize(8).fillColor('#000000')
         .text(item.quantity.toString(), qtyX, startY, { width: qtyWidth, align: 'right' })
         .text(item.unit, unitX, startY, { width: unitWidth })
         .text(item.unitPrice.toFixed(2), priceX, startY, { width: priceWidth, align: 'right' })
         .text(item.totalPrice.toFixed(2), totalX, startY, { width: totalWidth, align: 'right' });

      currentY = startY + Math.max(descHeight, 12) + 5;
    });

    // Draw line before totals
    currentY += 5;
    doc.lineWidth(0.5)
       .moveTo(priceX, currentY)
       .lineTo(pageWidth - marginRight, currentY)
       .stroke();

    // Totals section
    currentY += 8;
    
    // Check if ONLY totals + payment info fit on this page (don't include notes in this check)
    const totalsHeight = 50;
    const paymentHeight = (invoice.documentType === 'INVOICE' && template?.showPaymentInfo !== false) ? 75 : 15;
    const estimatedRemainder = totalsHeight + paymentHeight;
    
    // Check if content would overlap with footer area (footer starts at footerY ~792)
    if (currentY + estimatedRemainder > footerY - 20) {
      doc.addPage();
      currentY = marginTop;
    }

    doc.fontSize(9).font('Helvetica')
       .text('Zwischensumme:', 350, currentY)
       .text(invoice.subtotal.toFixed(2), totalX, currentY, { width: totalWidth, align: 'right' });

    currentY += 14;
    doc.text(`MwSt ${invoice.items[0]?.vatRate || 7.7}%:`, 350, currentY)
       .text(invoice.vatAmount.toFixed(2), totalX, currentY, { width: totalWidth, align: 'right' });

    currentY += 16;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Gesamtbetrag:', 350, currentY)
       .text(`CHF ${invoice.totalAmount.toFixed(2)}`, totalX, currentY, { width: totalWidth, align: 'right' });
    
    doc.fillColor('#000000');

    // Payment information (only for invoices)
    currentY += 30;
    
    if (invoice.documentType === 'INVOICE' && template?.showPaymentInfo !== false) {
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Zahlungsinformationen:', marginLeft, currentY);

      currentY += 14;
      const paymentTerms = template?.paymentTermsText || 'Zahlbar innert 30 Tagen netto.';
      const bank = template?.companyBank || 'Musterbank AG';
      const iban = template?.companyIban || 'CH00 0000 0000 0000 0000 0';
      
      doc.font('Helvetica')
         .text(paymentTerms, marginLeft, currentY);
      currentY += 13;
      doc.text(`Bank: ${bank}`, marginLeft, currentY);
      currentY += 13;
      doc.text(`IBAN: ${iban}`, marginLeft, currentY);
      currentY += 13;
      doc.text(`Kontoinhaber: ${companyName}`, marginLeft, currentY);
      currentY += 18;
    } else if (invoice.documentType === 'QUOTE') {
      doc.fontSize(9)
         .font('Helvetica')
         .text('Wir freuen uns über Ihre Rückmeldung zu diesem Angebot.', marginLeft, currentY);
      currentY += 18;
    }

    // Notes
    if (invoice.notes) {
      // Only create new page if we're really at the very bottom
      if (currentY > 700) {
        doc.addPage();
        currentY = marginTop;
      }
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('Bemerkungen:', marginLeft, currentY);
      
      currentY += 14;
      
      doc.font('Helvetica')
         .fillColor('#000000')
         .fontSize(8)
         .text(invoice.notes, marginLeft, currentY, { width: contentWidth });
    }

    // Footer removed - was causing page break issues

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};
