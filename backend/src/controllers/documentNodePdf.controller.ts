import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import MarkdownIt from 'markdown-it';
import { PrismaClient } from '@prisma/client';
import { JSDOM } from 'jsdom';

const prisma = new PrismaClient();
const md = new MarkdownIt({ html: true, breaks: true });

/**
 * Export a document node as PDF
 */
export const exportDocumentToPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get the document
    const document = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null,
        type: 'DOCUMENT',
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions (same as read permission)
    const userGroups = await prisma.userGroupMembership.findMany({
      where: {
        userId,
        userGroup: { isActive: true },
      },
      select: {
        userGroupId: true,
      },
    });

    const userGroupIds = userGroups.map((ug) => ug.userGroupId);

    const nodePermissions = await prisma.documentNodeGroupPermission.findMany({
      where: { documentNodeId: id },
    });

    // If permissions are set, check if user has access
    if (nodePermissions.length > 0) {
      const hasAccess = nodePermissions.some((perm) =>
        userGroupIds.includes(perm.userGroupId)
      );
      if (!hasAccess) {
        return res.status(403).json({ error: 'No permission to access this document' });
      }
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 70, left: 50, right: 50 }, // Bottom margin increased for footer
      bufferPages: true, // Enable page buffering for footer
    });

    // Set response headers for PDF download
    const filename = `${document.title.replace(/[^a-z0-9äöüß]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Render HTML to PDF with formatting
    const renderHTMLToPDF = (html: string, doc: PDFKit.PDFDocument) => {
      const dom = new JSDOM(html);
      const body = dom.window.document.body;

      const processNode = (node: any, currentStyle: any = {}) => {
        const { fontSize = 11, font = 'Helvetica', bold = false, italic = false, color = '#000000' } = currentStyle;

        if (node.nodeType === 3) { // Text node
          const text = node.textContent?.trim();
          if (text) {
            let fontName = 'Helvetica';
            if (bold && italic) fontName = 'Helvetica-BoldOblique';
            else if (bold) fontName = 'Helvetica-Bold';
            else if (italic) fontName = 'Helvetica-Oblique';

            doc.fontSize(fontSize).font(fontName).fillColor(color);
            
            // Check if we need a new page
            if (doc.y > doc.page.height - 120) { // More margin for footer
              doc.addPage();
            }
            
            doc.text(text, { continued: false });
          }
          return;
        }

        if (node.nodeType !== 1) return; // Only process element nodes

        const tagName = node.tagName?.toLowerCase();
        
        switch (tagName) {
          case 'h1':
            doc.moveDown(0.8);
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000');
            if (doc.y > doc.page.height - 120) doc.addPage();
            doc.text(node.textContent, { align: 'left' });
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset to default
            doc.moveDown(0.5);
            break;

          case 'h2':
            doc.moveDown(0.6);
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000');
            if (doc.y > doc.page.height - 120) doc.addPage();
            doc.text(node.textContent, { align: 'left' });
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset to default
            doc.moveDown(0.4);
            break;

          case 'h3':
            doc.moveDown(0.5);
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
            if (doc.y > doc.page.height - 120) doc.addPage();
            doc.text(node.textContent, { align: 'left' });
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset to default
            doc.moveDown(0.4);
            break;

          case 'h4':
            doc.moveDown(0.4);
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000');
            if (doc.y > doc.page.height - 120) doc.addPage();
            doc.text(node.textContent, { align: 'left' });
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset to default
            doc.moveDown(0.3);
            break;

          case 'h5':
          case 'h6':
            doc.moveDown(0.4);
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
            if (doc.y > doc.page.height - 120) doc.addPage();
            doc.text(node.textContent, { align: 'left' });
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset to default
            doc.moveDown(0.3);
            break;

          case 'p':
            if (doc.y > doc.page.height - 120) doc.addPage();
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Ensure default before processing
            for (const child of node.childNodes) {
              processNode(child, currentStyle);
            }
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset after processing
            doc.moveDown(0.5);
            break;

          case 'strong':
          case 'b':
            for (const child of node.childNodes) {
              processNode(child, { ...currentStyle, bold: true });
            }
            break;

          case 'em':
          case 'i':
            for (const child of node.childNodes) {
              processNode(child, { ...currentStyle, italic: true });
            }
            break;

          case 'code':
            doc.fontSize(10).font('Courier').fillColor('#d63384');
            doc.text(node.textContent, { continued: false });
            doc.fontSize(11).fillColor('#000000').font('Helvetica'); // Reset to default
            break;

          case 'pre':
            doc.moveDown(0.6);
            doc.fontSize(9).font('Courier').fillColor('#212529');
            const codeBlock = node.textContent || '';
            if (doc.y > doc.page.height - 170) doc.addPage();
            doc.rect(doc.x, doc.y, doc.page.width - 100, 10 + codeBlock.split('\n').length * 12)
               .fillAndStroke('#f8f9fa', '#dee2e6');
            doc.fillColor('#212529').text(codeBlock, doc.x + 10, doc.y + 5);
            doc.moveDown(0.8);
            doc.fontSize(11).fillColor('#000000').font('Helvetica'); // Reset to default
            break;

          case 'ul':
            doc.moveDown(0.5);
            for (const child of node.childNodes) {
              if (child.tagName?.toLowerCase() === 'li') {
                if (doc.y > doc.page.height - 120) doc.addPage();
                const xPos = doc.x;
                doc.fontSize(11).font('Helvetica').fillColor('#000000');
                
                // Build the text with formatting
                const parts: Array<{text: string, bold?: boolean, italic?: boolean}> = [];
                for (const liChild of child.childNodes) {
                  if (liChild.nodeType === 3) { // Text node
                    const text = liChild.textContent?.trim();
                    if (text) parts.push({ text });
                  } else if (liChild.nodeType === 1) {
                    const liTag = liChild.tagName?.toLowerCase();
                    const text = liChild.textContent?.trim();
                    if (text) {
                      if (liTag === 'strong' || liTag === 'b') {
                        parts.push({ text, bold: true });
                      } else if (liTag === 'em' || liTag === 'i') {
                        parts.push({ text, italic: true });
                      } else {
                        parts.push({ text });
                      }
                    }
                  }
                }
                
                // Render bullet and text
                doc.text('• ', { continued: true });
                parts.forEach((part, idx) => {
                  if (part.bold) doc.font('Helvetica-Bold');
                  else if (part.italic) doc.font('Helvetica-Oblique');
                  else doc.font('Helvetica');
                  
                  doc.text(part.text + (idx < parts.length - 1 ? ' ' : ''), { continued: idx < parts.length - 1 });
                });
                
                doc.font('Helvetica');
                doc.x = xPos;
              }
            }
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset to default
            doc.moveDown(0.7);
            break;

          case 'ol':
            doc.moveDown(0.5);
            let index = 1;
            for (const child of node.childNodes) {
              if (child.tagName?.toLowerCase() === 'li') {
                if (doc.y > doc.page.height - 120) doc.addPage();
                const xPos = doc.x;
                doc.fontSize(11).font('Helvetica').fillColor('#000000');
                
                // Build the text with formatting
                const parts: Array<{text: string, bold?: boolean, italic?: boolean}> = [];
                for (const liChild of child.childNodes) {
                  if (liChild.nodeType === 3) { // Text node
                    const text = liChild.textContent?.trim();
                    if (text) parts.push({ text });
                  } else if (liChild.nodeType === 1) {
                    const liTag = liChild.tagName?.toLowerCase();
                    const text = liChild.textContent?.trim();
                    if (text) {
                      if (liTag === 'strong' || liTag === 'b') {
                        parts.push({ text, bold: true });
                      } else if (liTag === 'em' || liTag === 'i') {
                        parts.push({ text, italic: true });
                      } else {
                        parts.push({ text });
                      }
                    }
                  }
                }
                
                // Render number and text
                doc.text(`${index}. `, { continued: true });
                parts.forEach((part, idx) => {
                  if (part.bold) doc.font('Helvetica-Bold');
                  else if (part.italic) doc.font('Helvetica-Oblique');
                  else doc.font('Helvetica');
                  
                  doc.text(part.text + (idx < parts.length - 1 ? ' ' : ''), { continued: idx < parts.length - 1 });
                });
                
                doc.font('Helvetica');
                doc.x = xPos;
                index++;
              }
            }
            doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Reset to default
            doc.moveDown(0.7);
            break;

          case 'blockquote':
            doc.moveDown(0.6);
            const oldX = doc.x;
            doc.x += 20;
            doc.fontSize(11).font('Helvetica-Oblique').fillColor('#6c757d');
            if (doc.y > doc.page.height - 120) doc.addPage();
            doc.text(node.textContent.trim());
            doc.x = oldX;
            doc.fontSize(11).fillColor('#000000').font('Helvetica'); // Reset to default
            doc.moveDown(0.7);
            break;

          case 'hr':
            doc.moveDown(0.7);
            doc.strokeColor('#dee2e6')
               .lineWidth(1)
               .moveTo(50, doc.y)
               .lineTo(doc.page.width - 50, doc.y)
               .stroke();
            doc.moveDown(0.5);
            break;

          case 'br':
            doc.moveDown(0.3);
            break;

          case 'a':
            doc.fontSize(11).fillColor('#0d6efd').font('Helvetica');
            doc.text(node.textContent, { link: node.getAttribute('href'), underline: true, continued: false });
            doc.fontSize(11).fillColor('#000000').font('Helvetica'); // Reset to default
            break;

          default:
            // Process children for other elements
            for (const child of node.childNodes) {
              processNode(child, currentStyle);
            }
            break;
        }
      };

      // Process all children of body
      for (const child of body.childNodes) {
        processNode(child);
      }
    };

    // Add title
    doc.fontSize(24).font('Helvetica-Bold').text(document.title, {
      align: 'left',
    });

    doc.moveDown(0.5);

    // Add metadata
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    
    if (document.updatedBy) {
      doc.text(`Autor: ${document.updatedBy.firstName} ${document.updatedBy.lastName}`);
    }
    
    if (document.createdAt) {
      doc.text(`Erstellt: ${new Date(document.createdAt).toLocaleString('de-DE')}`);
    }
    
    if (document.updatedAt) {
      doc.text(`Zuletzt bearbeitet: ${new Date(document.updatedAt).toLocaleString('de-DE')}`);
    }

    doc.moveDown(1);
    doc.fillColor('#000000');

    // Add horizontal line
    doc.strokeColor('#cccccc')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();

    doc.moveDown(1);

    // Convert Markdown to HTML and render
    const htmlContent = md.render(document.content);
    renderHTMLToPDF(htmlContent, doc);

    // Finalize PDF
    doc.end();
  } catch (err: any) {
    console.error('PDF export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }
};
