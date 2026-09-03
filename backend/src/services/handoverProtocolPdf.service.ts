import PDFDocument from 'pdfkit';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { CONDITION_LABELS, TYPE_LABELS } from './handoverProtocol.service';

/**
 * Übergabeprotokoll-PDF
 * Erzeugt das unterschriftsreife Protokoll (Übergabe/Rücknahme von Betriebsmitteln)
 * als PDF-Buffer. Layout und Farbwelt folgen dem Incident-Report.
 */

const COLORS = {
  brandFrom: '#10b981',
  brandTo: '#0ea5e9',
  ink: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  panel: '#f8fafc',
  panelAlt: '#f1f5f9',
  white: '#ffffff',
};

const PAGE = { width: 595.28, height: 841.89, margin: 50 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const HEADER_HEIGHT = 110;
const FOOTER_HEIGHT = 40;
const MAX_Y = PAGE.height - PAGE.margin - FOOTER_HEIGHT;

const KIND_LABELS: Record<string, string> = {
  DEVICE: 'Gerät',
  TOOL: 'Werkzeug',
  EQUIPMENT: 'Ausrüstung',
  OTHER: 'Sonstiges',
};

function fmtDate(date: any): string {
  if (!date) return '–';
  return new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(date: any): string {
  if (!date) return '–';
  return new Date(date).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fullName(person: any): string {
  if (!person) return '–';
  return `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || '–';
}

async function loadImage(source?: string | null): Promise<Buffer | null> {
  if (!source) return null;
  try {
    if (source.startsWith('data:')) {
      return Buffer.from(source.substring(source.indexOf(',') + 1), 'base64');
    }
    if (source.startsWith('http')) {
      const response = await axios.get(source, { responseType: 'arraybuffer', timeout: 5000 });
      return Buffer.from(response.data);
    }
    let filePath = source;
    if (filePath.startsWith('/uploads/')) {
      filePath = path.join(__dirname, '../..', filePath);
    }
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  } catch (error) {
    console.error('Übergabeprotokoll-PDF: Bild konnte nicht geladen werden:', error);
  }
  return null;
}

export async function generateHandoverProtocolPdfBuffer(protocol: any, settings: any): Promise<Buffer> {
  const companyName = settings?.companyName || 'CFlux';
  const logoBuffer = await loadImage(settings?.companyLogo);
  const signatureRecipient = await loadImage(protocol.signatureRecipientPath);
  const signatureIssuer = await loadImage(protocol.signatureIssuerPath);
  const isReturn = protocol.type === 'RETURN';
  const typeLabel = TYPE_LABELS[protocol.type as 'HANDOVER' | 'RETURN'] || protocol.type;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: `${typeLabel}protokoll ${protocol.protocolNumber}`,
      Author: companyName,
      Subject: `${typeLabel} von Betriebsmitteln`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > MAX_Y) {
      doc.addPage();
      y = PAGE.margin;
    }
  };

  const drawHeaderBand = () => {
    const grad = doc.linearGradient(0, 0, PAGE.width, HEADER_HEIGHT);
    grad.stop(0, COLORS.brandFrom).stop(1, COLORS.brandTo);
    doc.rect(0, 0, PAGE.width, HEADER_HEIGHT).fill(grad);

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, PAGE.width - PAGE.margin - 120, 22, { fit: [120, 42], align: 'right' });
      } catch {
        /* ungültiges Logoformat ignorieren */
      }
    }

    doc.fillColor(COLORS.white);
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(companyName.toUpperCase(), PAGE.margin, 24, { characterSpacing: 1.5 });
    doc.font('Helvetica-Bold').fontSize(24).text(`${typeLabel}protokoll`, PAGE.margin, 44);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#e0f2fe')
      .text(
        isReturn ? 'Rücknahme von Betriebsmitteln' : 'Übergabe von Betriebsmitteln',
        PAGE.margin,
        76
      );

    const label = protocol.protocolNumber;
    doc.font('Helvetica-Bold').fontSize(10);
    const tw = doc.widthOfString(label) + 20;
    const chipX = PAGE.width - PAGE.margin - tw;
    doc.save();
    doc.fillOpacity(0.2).roundedRect(chipX, 74, tw, 20, 10).fill(COLORS.white);
    doc.restore();
    doc.fillColor(COLORS.white).text(label, chipX + 10, 79.5);

    y = HEADER_HEIGHT + 24;
    doc.fillColor(COLORS.text);
  };

  const sectionTitle = (title: string) => {
    y += 6;
    ensureSpace(34);
    doc.rect(PAGE.margin, y, 4, 14).fill(COLORS.brandTo);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.ink).text(title, PAGE.margin + 12, y - 1);
    y += 24;
    doc.fillColor(COLORS.text);
  };

  const definitionGrid = (rows: Array<[string, string]>) => {
    const colGap = 24;
    const colWidth = (CONTENT_WIDTH - colGap) / 2;
    const rowHeight = 20;

    for (let i = 0; i < rows.length; i += 2) {
      ensureSpace(rowHeight + 8);
      [rows[i], rows[i + 1]].forEach((entry, col) => {
        if (!entry) return;
        const x = PAGE.margin + col * (colWidth + colGap);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(COLORS.muted)
          .text(entry[0].toUpperCase(), x, y, { width: colWidth, characterSpacing: 0.3 });
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(COLORS.ink)
          .text(entry[1] || '–', x, y + 9, { width: colWidth });
      });
      y += rowHeight + 8;
    }
    doc.fillColor(COLORS.text);
  };

  const paragraph = (text: string) => {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
    const h = doc.heightOfString(text, { width: CONTENT_WIDTH, lineGap: 2 });
    ensureSpace(h + 4);
    doc.text(text, PAGE.margin, y, { width: CONTENT_WIDTH, lineGap: 2 });
    y += h + 8;
  };

  // ---------- Inhalt ----------
  drawHeaderBand();

  const recipient = protocol.employee || protocol.user;
  sectionTitle('Empfänger');
  definitionGrid([
    ['Name', fullName(recipient)],
    ['E-Mail', recipient?.email || '–'],
    ['Personalnummer', protocol.employee?.employeeNumber || '–'],
    ['Abteilung', protocol.employee?.department || '–'],
    ['Funktion', protocol.employee?.position || '–'],
    [isReturn ? 'Rücknahmedatum' : 'Übergabedatum', fmtDate(protocol.handoverDate)],
    ['Ort', protocol.location || '–'],
    ['Übergeben durch', fullName(protocol.issuedBy)],
  ]);

  // ---------- Positionstabelle ----------
  const items: any[] = protocol.items || [];
  sectionTitle(`Positionen (${items.length})`);

  const columns: Array<{ key: string; label: string; w: number }> = [
    { key: 'pos', label: 'Nr.', w: 28 },
    { key: 'name', label: 'Bezeichnung', w: 148 },
    { key: 'kind', label: 'Art', w: 58 },
    { key: 'ident', label: 'Serien-/Inv.-Nr.', w: 105 },
    { key: 'condition', label: 'Zustand', w: 58 },
    { key: 'accessories', label: 'Zubehör', w: CONTENT_WIDTH - 28 - 148 - 58 - 105 - 58 },
  ];

  const drawTableHeader = () => {
    ensureSpace(22);
    doc.rect(PAGE.margin, y, CONTENT_WIDTH, 20).fill(COLORS.panelAlt);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.muted);
    let x = PAGE.margin;
    columns.forEach((c) => {
      doc.text(c.label.toUpperCase(), x + 5, y + 6.5, { width: c.w - 10, lineBreak: false });
      x += c.w;
    });
    y += 20;
    doc.fillColor(COLORS.text);
  };

  drawTableHeader();

  items.forEach((item, index) => {
    const ident = [item.serialNumber, item.inventoryNumber].filter(Boolean).join(' / ') || '–';
    const cells: Record<string, string> = {
      pos: String(index + 1),
      name: item.name,
      kind: KIND_LABELS[item.kind] || item.kind,
      ident,
      condition: CONDITION_LABELS[item.condition as keyof typeof CONDITION_LABELS] || item.condition,
      accessories: item.accessories || '–',
    };

    // Zeilenhöhe an der höchsten Zelle ausrichten
    doc.font('Helvetica').fontSize(9);
    let rowHeight = 18;
    columns.forEach((c) => {
      const h = doc.heightOfString(cells[c.key], { width: c.w - 10 }) + 10;
      if (h > rowHeight) rowHeight = h;
    });

    if (y + rowHeight > MAX_Y) {
      doc.addPage();
      y = PAGE.margin;
      drawTableHeader();
    }

    if (index % 2 === 1) {
      doc.rect(PAGE.margin, y, CONTENT_WIDTH, rowHeight).fill(COLORS.panel);
    }

    doc.font('Helvetica').fontSize(9).fillColor(COLORS.ink);
    let x = PAGE.margin;
    columns.forEach((c) => {
      doc.text(cells[c.key], x + 5, y + 5, { width: c.w - 10 });
      x += c.w;
    });

    doc
      .moveTo(PAGE.margin, y + rowHeight)
      .lineTo(PAGE.width - PAGE.margin, y + rowHeight)
      .lineWidth(0.5)
      .stroke(COLORS.border);
    y += rowHeight;

    if (item.notes) {
      const noteText = `Anmerkung: ${item.notes}`;
      doc.font('Helvetica-Oblique').fontSize(8.5);
      const h = doc.heightOfString(noteText, { width: CONTENT_WIDTH - 20 });
      ensureSpace(h + 8);
      // Gleiche Hinterlegung wie die zugehörige Zeile, sonst wirkt die Anmerkung
      // optisch als Teil der nächsten Position
      if (index % 2 === 1) {
        doc.rect(PAGE.margin, y, CONTENT_WIDTH, h + 8).fill(COLORS.panel);
      }
      doc
        .font('Helvetica-Oblique')
        .fontSize(8.5)
        .fillColor(COLORS.muted)
        .text(noteText, PAGE.margin + 10, y + 3, { width: CONTENT_WIDTH - 20 });
      y += h + 8;
      doc
        .moveTo(PAGE.margin, y)
        .lineTo(PAGE.width - PAGE.margin, y)
        .lineWidth(0.5)
        .stroke(COLORS.border);
      doc.fillColor(COLORS.text);
    }
  });

  y += 12;

  // ---------- Bemerkungen ----------
  if (protocol.notes) {
    sectionTitle('Bemerkungen');
    paragraph(protocol.notes);
  }

  // ---------- Erklärung ----------
  sectionTitle('Erklärung');
  paragraph(
    isReturn
      ? 'Die oben aufgeführten Betriebsmittel wurden vollständig und im dokumentierten Zustand ' +
          'zurückgegeben. Beide Parteien bestätigen die Richtigkeit der Angaben.'
      : 'Die oben aufgeführten Betriebsmittel wurden im dokumentierten Zustand übergeben. Der Empfänger ' +
          'bestätigt den Erhalt, verpflichtet sich zur sorgfältigen Behandlung und ausschliesslich ' +
          'dienstlichen Nutzung und gibt die Gegenstände auf Verlangen sowie bei Beendigung des ' +
          'Arbeitsverhältnisses unaufgefordert und vollständig zurück. Verlust oder Beschädigung sind ' +
          'unverzüglich zu melden. Es gelten die IT-Nutzungsrichtlinien des Unternehmens.'
  );

  // ---------- Unterschriften ----------
  const signatureBlockHeight = 92;
  ensureSpace(signatureBlockHeight + 10);
  y += 10;

  const colWidth = (CONTENT_WIDTH - 40) / 2;
  const blocks: Array<{ label: string; name: string; image: Buffer | null }> = [
    { label: 'Empfänger', name: fullName(recipient), image: signatureRecipient },
    { label: 'Übergeber', name: fullName(protocol.issuedBy), image: signatureIssuer },
  ];

  blocks.forEach((block, col) => {
    const x = PAGE.margin + col * (colWidth + 40);
    if (block.image) {
      try {
        doc.image(block.image, x, y, { fit: [colWidth - 10, 42] });
      } catch {
        /* ungültiges Signaturformat ignorieren */
      }
    }
    const lineY = y + 48;
    doc.moveTo(x, lineY).lineTo(x + colWidth, lineY).lineWidth(0.8).stroke(COLORS.ink);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.ink)
      .text(block.name, x, lineY + 5, { width: colWidth });
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(
        `${block.label} · Datum, Unterschrift`,
        x,
        lineY + 17,
        { width: colWidth }
      );
  });
  y += signatureBlockHeight;

  if (protocol.signedAt) {
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(`Als unterschrieben erfasst am ${fmtDateTime(protocol.signedAt)}`, PAGE.margin, y, {
        width: CONTENT_WIDTH,
      });
  }

  // ---------- Fusszeilen ----------
  const generatedAt = fmtDateTime(new Date());
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const footerY = PAGE.height - PAGE.margin - 26;
    doc
      .moveTo(PAGE.margin, footerY - 6)
      .lineTo(PAGE.width - PAGE.margin, footerY - 6)
      .lineWidth(0.5)
      .stroke(COLORS.border);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `${companyName} · ${protocol.protocolNumber} · Erstellt am ${generatedAt}`,
        PAGE.margin,
        footerY,
        { width: CONTENT_WIDTH - 60, lineBreak: false }
      );
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(`Seite ${i + 1} / ${range.count}`, PAGE.margin, footerY, {
        width: CONTENT_WIDTH,
        align: 'right',
        lineBreak: false,
      });
  }

  doc.end();
  return done;
}
