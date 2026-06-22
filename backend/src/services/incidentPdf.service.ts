import PDFDocument from 'pdfkit';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

/**
 * Incident PDF Service
 * Erzeugt einen hochwertigen, für die Geschäftsleitung aufbereiteten
 * Vorfallbericht (Incident Report) als PDF-Buffer.
 */

// ==================== Farb- und Layout-Konstanten ====================

const COLORS = {
  brandFrom: '#10b981', // Grün
  brandTo: '#0ea5e9', // Blau
  ink: '#0f172a', // Sehr dunkles Slate (Überschriften)
  text: '#334155', // Fliesstext
  muted: '#64748b', // Sekundärtext
  border: '#e2e8f0', // Linien/Rahmen
  panel: '#f8fafc', // Heller Panel-Hintergrund
  panelAlt: '#f1f5f9',
  white: '#ffffff',
};

const PAGE = {
  width: 595.28, // A4
  height: 841.89, // A4
  margin: 50,
};
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const HEADER_HEIGHT = 118;
const FOOTER_HEIGHT = 40;
const MAX_Y = PAGE.height - PAGE.margin - FOOTER_HEIGHT;

// ==================== Label-Übersetzungen ====================

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#0ea5e9',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#64748b',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#16a34a',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#dc2626',
};

const EHS_CATEGORY_LABELS: Record<string, string> = {
  UNSAFE_CONDITION: 'Unsicherer Zustand',
  UNSAFE_BEHAVIOR: 'Unsicheres Verhalten',
  NEAR_MISS: 'Beinaheunfall',
  FIRST_AID: 'Erste Hilfe',
  RECORDABLE: 'Meldepflichtig',
  LTI: 'Ausfalltag-Unfall (LTI)',
  FATALITY: 'Todesfall',
  PROPERTY_DAMAGE: 'Sachschaden',
  ENVIRONMENT: 'Umwelt',
  SAFETY_OBSERVATION: 'Sicherheitsbeobachtung',
};

const EHS_SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Gering',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

// ==================== Hilfsfunktionen ====================

function fmtDate(date: any): string {
  if (!date) return '–';
  return new Date(date).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

function fullName(user: any): string {
  if (!user) return '–';
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '–';
}

function daysBetween(from: any, to: any): number {
  if (!from) return 0;
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

/**
 * Lädt ein Logo (Data-URI, http(s)-URL oder Dateipfad) als Buffer.
 */
async function loadLogo(logo?: string | null): Promise<Buffer | null> {
  if (!logo) return null;
  try {
    if (logo.startsWith('data:')) {
      const base64 = logo.substring(logo.indexOf(',') + 1);
      return Buffer.from(base64, 'base64');
    }
    if (logo.startsWith('http')) {
      const response = await axios.get(logo, { responseType: 'arraybuffer', timeout: 5000 });
      return Buffer.from(response.data);
    }
    let logoPath = logo;
    if (logoPath.startsWith('/uploads/')) {
      logoPath = path.join(__dirname, '../..', logoPath);
    }
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath);
    }
  } catch (error) {
    console.error('Incident-PDF: Logo konnte nicht geladen werden:', error);
  }
  return null;
}

// ==================== Haupt-Generator ====================

export async function generateIncidentPdfBuffer(
  incident: any,
  settings: any
): Promise<Buffer> {
  const companyName = settings?.companyName || 'CFlux';
  const logoBuffer = await loadLogo(settings?.companyLogo);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: `Vorfallbericht ${incident.incidentNumber || ''}`.trim(),
      Author: companyName,
      Subject: incident.title,
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // ---------- Wiederverwendbare Zeichen-Helfer ----------

  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > MAX_Y) {
      doc.addPage();
      y = PAGE.margin;
    }
  };

  const drawHeaderBand = () => {
    // Gradient-Band
    const grad = doc.linearGradient(0, 0, PAGE.width, HEADER_HEIGHT);
    grad.stop(0, COLORS.brandFrom).stop(1, COLORS.brandTo);
    doc.rect(0, 0, PAGE.width, HEADER_HEIGHT).fill(grad);

    // Logo (rechts, falls vorhanden)
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, PAGE.width - PAGE.margin - 120, 24, {
          fit: [120, 46],
          align: 'right',
        });
      } catch {
        /* Logo ignorieren, falls Format ungültig */
      }
    }

    doc.fillColor(COLORS.white);
    doc.font('Helvetica-Bold').fontSize(11).text(companyName.toUpperCase(), PAGE.margin, 26, {
      characterSpacing: 1.5,
    });
    doc.font('Helvetica-Bold').fontSize(24).text('Vorfallbericht', PAGE.margin, 46);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#e0f2fe')
      .text('Incident Report für die Geschäftsleitung', PAGE.margin, 78);

    // Vorfallnummer-Chip rechts unten im Band
    if (incident.incidentNumber) {
      const label = incident.incidentNumber;
      doc.font('Helvetica-Bold').fontSize(10);
      const tw = doc.widthOfString(label) + 20;
      const chipX = PAGE.width - PAGE.margin - tw;
      const chipY = 80;
      doc.save();
      doc.fillOpacity(0.2).roundedRect(chipX, chipY, tw, 20, 10).fill(COLORS.white);
      doc.restore();
      doc.fillColor(COLORS.white).text(label, chipX + 10, chipY + 5.5);
    }

    y = HEADER_HEIGHT + 24;
    doc.fillColor(COLORS.text);
  };

  // Farbige Pille (Badge) – gibt Breite zurück
  const drawBadge = (label: string, x: number, by: number, color: string): number => {
    doc.font('Helvetica-Bold').fontSize(9);
    const w = doc.widthOfString(label) + 18;
    doc.roundedRect(x, by, w, 18, 9).fill(color);
    doc.fillColor(COLORS.white).text(label, x + 9, by + 5);
    doc.fillColor(COLORS.text);
    return w;
  };

  // Sektionsüberschrift mit Akzentbalken
  const sectionTitle = (title: string) => {
    ensureSpace(34);
    doc.rect(PAGE.margin, y, 4, 14).fill(COLORS.brandTo);
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(COLORS.ink)
      .text(title, PAGE.margin + 12, y - 1);
    y += 24;
    doc.fillColor(COLORS.text);
  };

  // Mehrzeiliger Textblock
  const paragraph = (text: string, options?: { size?: number; color?: string }) => {
    const size = options?.size ?? 10;
    doc.font('Helvetica').fontSize(size).fillColor(options?.color ?? COLORS.text);
    const h = doc.heightOfString(text, { width: CONTENT_WIDTH, lineGap: 2 });
    ensureSpace(h + 4);
    doc.text(text, PAGE.margin, y, { width: CONTENT_WIDTH, lineGap: 2 });
    y += h + 8;
    doc.fillColor(COLORS.text);
  };

  // Definitionsliste in zwei Spalten (Label/Wert)
  const definitionGrid = (rows: Array<[string, string]>) => {
    const colGap = 24;
    const colWidth = (CONTENT_WIDTH - colGap) / 2;
    const labelWidth = 120;
    const rowHeight = 20;

    for (let i = 0; i < rows.length; i += 2) {
      ensureSpace(rowHeight);
      const pair = [rows[i], rows[i + 1]];
      pair.forEach((entry, col) => {
        if (!entry) return;
        const x = PAGE.margin + col * (colWidth + colGap);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(COLORS.muted)
          .text(entry[0].toUpperCase(), x, y, { width: labelWidth, characterSpacing: 0.3 });
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

  // ---------- Seiteninhalt ----------

  drawHeaderBand();

  // Titel des Vorfalls
  doc.font('Helvetica-Bold').fontSize(17).fillColor(COLORS.ink);
  const titleH = doc.heightOfString(incident.title, { width: CONTENT_WIDTH });
  doc.text(incident.title, PAGE.margin, y, { width: CONTENT_WIDTH });
  y += titleH + 10;

  // Status- / Prioritäts- / EHS-Badges
  let badgeX = PAGE.margin;
  badgeX += drawBadge(
    `Status: ${STATUS_LABELS[incident.status] || incident.status}`,
    badgeX,
    y,
    STATUS_COLORS[incident.status] || COLORS.muted
  ) + 8;
  badgeX += drawBadge(
    `Priorität: ${PRIORITY_LABELS[incident.priority] || incident.priority}`,
    badgeX,
    y,
    PRIORITY_COLORS[incident.priority] || COLORS.muted
  ) + 8;
  if (incident.isEHSRelevant) {
    badgeX += drawBadge('EHS-relevant', badgeX, y, '#7c3aed') + 8;
  }
  y += 32;

  // ---------- KPI-Karten ----------
  const kpis: Array<{ label: string; value: string }> = [
    { label: 'Gemeldet am', value: fmtDate(incident.reportedAt) },
    {
      label: incident.resolvedAt ? 'Dauer bis Lösung' : 'Tage offen',
      value: `${daysBetween(incident.reportedAt, incident.resolvedAt || incident.closedAt)} Tage`,
    },
    { label: 'Kategorie', value: incident.category || '–' },
    {
      label: 'Zugewiesen an',
      value: incident.assignedTo ? fullName(incident.assignedTo) : 'Nicht zugewiesen',
    },
  ];

  const cardGap = 12;
  const cardWidth = (CONTENT_WIDTH - cardGap * (kpis.length - 1)) / kpis.length;
  const cardHeight = 56;
  ensureSpace(cardHeight + 10);
  kpis.forEach((kpi, i) => {
    const x = PAGE.margin + i * (cardWidth + cardGap);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fill(COLORS.panelAlt);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).lineWidth(0.5).stroke(COLORS.border);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(kpi.label.toUpperCase(), x + 10, y + 10, { width: cardWidth - 20, characterSpacing: 0.3 });
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(COLORS.ink)
      .text(kpi.value, x + 10, y + 26, { width: cardWidth - 20, ellipsis: true });
  });
  y += cardHeight + 24;
  doc.fillColor(COLORS.text);

  // ---------- Übersicht ----------
  sectionTitle('Übersicht');
  definitionGrid([
    ['Vorfallnummer', incident.incidentNumber || '–'],
    ['Betroffenes System', incident.affectedSystem || '–'],
    ['Gemeldet von', fullName(incident.reportedBy)],
    ['Projekt', incident.project?.name || '–'],
    ['Ort', incident.location || '–'],
    ['Vorfallsdatum', fmtDate(incident.incidentDate)],
    ['Fällig am', fmtDate(incident.dueDate)],
    ['Gelöst am', fmtDate(incident.resolvedAt)],
  ]);
  y += 4;

  // ---------- Beschreibung ----------
  sectionTitle('Beschreibung');
  paragraph(incident.description || 'Keine Beschreibung vorhanden.');

  // ---------- Lösung & Maßnahmen ----------
  if (incident.solution || incident.correctiveActions || incident.preventiveActions) {
    sectionTitle('Lösung & Maßnahmen');
    if (incident.solution) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink);
      ensureSpace(16);
      doc.text('Lösung', PAGE.margin, y);
      y += 14;
      paragraph(incident.solution);
    }
    if (incident.correctiveActions) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink);
      ensureSpace(16);
      doc.text('Korrekturmaßnahmen', PAGE.margin, y);
      y += 14;
      paragraph(incident.correctiveActions);
    }
    if (incident.preventiveActions) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink);
      ensureSpace(16);
      doc.text('Präventivmaßnahmen', PAGE.margin, y);
      y += 14;
      paragraph(incident.preventiveActions);
    }
  }

  // ---------- EHS-Details ----------
  if (incident.isEHSRelevant) {
    sectionTitle('EHS – Arbeitssicherheit & Gesundheit');
    definitionGrid([
      ['EHS-Kategorie', EHS_CATEGORY_LABELS[incident.ehsCategory] || incident.ehsCategory || '–'],
      ['EHS-Schweregrad', EHS_SEVERITY_LABELS[incident.ehsSeverity] || incident.ehsSeverity || '–'],
      ['Verlorene Arbeitstage', incident.lostWorkDays != null ? String(incident.lostWorkDays) : '–'],
      ['Ärztliche Behandlung', incident.medicalTreatment ? 'Ja' : 'Nein'],
      ['Krankenhaus erforderlich', incident.hospitalRequired ? 'Ja' : 'Nein'],
      ['Arbeiter am Tag', incident.workersOnDay != null ? String(incident.workersOnDay) : '–'],
      ['Gearbeitete Stunden', incident.hoursWorkedDay != null ? String(incident.hoursWorkedDay) : '–'],
    ]);
    y += 4;
  }

  // ---------- Notizen ----------
  if (incident.notes) {
    sectionTitle('Interne Notizen');
    paragraph(incident.notes, { color: COLORS.muted });
  }

  // ---------- Zeitleiste ----------
  sectionTitle('Zeitleiste');
  const timeline: Array<[string, any]> = [
    ['Gemeldet', incident.reportedAt],
    ['Vorfall ereignet', incident.incidentDate],
    ['Gelöst', incident.resolvedAt],
    ['Geschlossen', incident.closedAt],
    ['Zuletzt aktualisiert', incident.updatedAt],
  ].filter((t) => t[1]) as Array<[string, any]>;

  timeline.forEach(([label, date]) => {
    ensureSpace(18);
    doc.circle(PAGE.margin + 4, y + 6, 3).fill(COLORS.brandTo);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink).text(label, PAGE.margin + 16, y);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(fmtDateTime(date), PAGE.margin + 160, y);
    y += 18;
  });
  y += 12;
  doc.fillColor(COLORS.text);

  // ---------- Kommentare ----------
  const comments = incident.comments || [];
  if (comments.length > 0) {
    sectionTitle(`Verlauf & Kommentare (${comments.length})`);
    comments.forEach((c: any) => {
      const author = fullName(c.user);
      const when = fmtDateTime(c.createdAt);
      doc.font('Helvetica').fontSize(9);
      const bodyH = doc.heightOfString(c.comment || '', { width: CONTENT_WIDTH - 24, lineGap: 1 });
      const boxH = bodyH + 30;
      ensureSpace(boxH + 8);
      doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, boxH, 6).fill(COLORS.panel);
      doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, boxH, 6).lineWidth(0.5).stroke(COLORS.border);
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(COLORS.ink)
        .text(author, PAGE.margin + 12, y + 8);
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(COLORS.muted)
        .text(when, PAGE.margin + 12, y + 8, { width: CONTENT_WIDTH - 24, align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.text)
        .text(c.comment || '', PAGE.margin + 12, y + 22, { width: CONTENT_WIDTH - 24, lineGap: 1 });
      y += boxH + 8;
    });
  }

  // ---------- Anhänge ----------
  const attachments = incident.attachments || [];
  if (attachments.length > 0) {
    sectionTitle(`Anhänge (${attachments.length})`);
    attachments.forEach((a: any) => {
      ensureSpace(16);
      const sizeKb = a.fileSize ? `${Math.round(a.fileSize / 1024)} KB` : '';
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.text);
      doc.text(`• ${a.originalFilename || a.filename}`, PAGE.margin + 4, y, {
        width: CONTENT_WIDTH - 120,
      });
      doc
        .fontSize(8.5)
        .fillColor(COLORS.muted)
        .text(sizeKb, PAGE.margin, y, { width: CONTENT_WIDTH, align: 'right' });
      y += 16;
    });
  }

  // ---------- Fuß- und Kopfzeilen über alle Seiten ----------
  const generatedAt = fmtDateTime(new Date());
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);

    // Fußzeile bewusst oberhalb der Bottom-Margin-Schwelle platzieren und
    // lineBreak deaktivieren, damit PDFKit keine automatischen (leeren)
    // Folgeseiten anhängt.
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
        `${companyName} · Vertraulich – nur für interne Verwendung · Erstellt am ${generatedAt}`,
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

// ==================== Gesamtbericht (Management-Übersicht) ====================

export async function generateIncidentsSummaryPdfBuffer(
  incidents: any[],
  settings: any,
  meta?: { filterLabel?: string }
): Promise<Buffer> {
  const companyName = settings?.companyName || 'CFlux';
  const logoBuffer = await loadLogo(settings?.companyLogo);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: 'Vorfallbericht – Gesamtübersicht',
      Author: companyName,
      Subject: 'Incident Management Management-Report',
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

  const sectionTitle = (title: string) => {
    ensureSpace(34);
    doc.rect(PAGE.margin, y, 4, 14).fill(COLORS.brandTo);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.ink).text(title, PAGE.margin + 12, y - 1);
    y += 24;
    doc.fillColor(COLORS.text);
  };

  // ---------- Kennzahlen berechnen ----------
  const now = Date.now();
  const count = (pred: (i: any) => boolean) => incidents.filter(pred).length;

  const total = incidents.length;
  const byStatus = {
    OPEN: count((i) => i.status === 'OPEN'),
    IN_PROGRESS: count((i) => i.status === 'IN_PROGRESS'),
    RESOLVED: count((i) => i.status === 'RESOLVED'),
    CLOSED: count((i) => i.status === 'CLOSED'),
  };
  const byPriority = {
    CRITICAL: count((i) => i.priority === 'CRITICAL'),
    HIGH: count((i) => i.priority === 'HIGH'),
    MEDIUM: count((i) => i.priority === 'MEDIUM'),
    LOW: count((i) => i.priority === 'LOW'),
  };
  const ehsCount = count((i) => i.isEHSRelevant);
  const overdue = count(
    (i) => i.dueDate && new Date(i.dueDate).getTime() < now && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  );
  const resolvedDurations = incidents
    .filter((i) => i.resolvedAt)
    .map((i) => daysBetween(i.reportedAt, i.resolvedAt));
  const avgResolution =
    resolvedDurations.length > 0
      ? Math.round(resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length)
      : null;
  const totalLostWorkDays = incidents.reduce((sum, i) => sum + (i.lostWorkDays || 0), 0);

  // Kategorien zählen
  const categoryCounts: Record<string, number> = {};
  incidents.forEach((i) => {
    const key = i.category || 'Ohne Kategorie';
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });

  // ---------- Kopfband ----------
  const drawHeaderBand = () => {
    const grad = doc.linearGradient(0, 0, PAGE.width, HEADER_HEIGHT);
    grad.stop(0, COLORS.brandFrom).stop(1, COLORS.brandTo);
    doc.rect(0, 0, PAGE.width, HEADER_HEIGHT).fill(grad);

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, PAGE.width - PAGE.margin - 120, 24, { fit: [120, 46] });
      } catch {
        /* ignore */
      }
    }

    doc.fillColor(COLORS.white);
    doc.font('Helvetica-Bold').fontSize(11).text(companyName.toUpperCase(), PAGE.margin, 26, {
      characterSpacing: 1.5,
    });
    doc.font('Helvetica-Bold').fontSize(24).text('Vorfallbericht', PAGE.margin, 46);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#e0f2fe')
      .text('Gesamtübersicht – Management-Report', PAGE.margin, 78);

    y = HEADER_HEIGHT + 24;
    doc.fillColor(COLORS.text);
  };

  drawHeaderBand();

  // Berichtszeitraum / Filter
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`Auswertung: ${meta?.filterLabel || 'Alle Vorfälle'}`, PAGE.margin, y);
  doc.text(`Erstellt am ${fmtDateTime(new Date())}`, PAGE.margin, y, {
    width: CONTENT_WIDTH,
    align: 'right',
  });
  y += 24;
  doc.fillColor(COLORS.text);

  // ---------- KPI-Karten (zwei Reihen à 4) ----------
  const kpis: Array<{ label: string; value: string; color?: string }> = [
    { label: 'Vorfälle gesamt', value: String(total) },
    { label: 'Offen', value: String(byStatus.OPEN), color: STATUS_COLORS.OPEN },
    { label: 'In Bearbeitung', value: String(byStatus.IN_PROGRESS), color: STATUS_COLORS.IN_PROGRESS },
    { label: 'Gelöst', value: String(byStatus.RESOLVED), color: STATUS_COLORS.RESOLVED },
    { label: 'Kritisch', value: String(byPriority.CRITICAL), color: PRIORITY_COLORS.CRITICAL },
    { label: 'Überfällig', value: String(overdue), color: overdue > 0 ? '#dc2626' : COLORS.muted },
    { label: 'EHS-relevant', value: String(ehsCount), color: '#7c3aed' },
    { label: 'Ø Lösungsdauer', value: avgResolution != null ? `${avgResolution} T` : '–' },
  ];

  const perRow = 4;
  const cardGap = 12;
  const cardWidth = (CONTENT_WIDTH - cardGap * (perRow - 1)) / perRow;
  const cardHeight = 56;
  kpis.forEach((kpi, i) => {
    const col = i % perRow;
    if (col === 0) ensureSpace(cardHeight + cardGap);
    const x = PAGE.margin + col * (cardWidth + cardGap);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fill(COLORS.panelAlt);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).lineWidth(0.5).stroke(COLORS.border);
    // Akzentbalken oben
    doc.roundedRect(x, y, cardWidth, 3, 1.5).fill(kpi.color || COLORS.brandTo);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(kpi.label.toUpperCase(), x + 10, y + 12, { width: cardWidth - 20, characterSpacing: 0.3 });
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(COLORS.ink)
      .text(kpi.value, x + 10, y + 26, { width: cardWidth - 20 });
    if (col === perRow - 1) y += cardHeight + cardGap;
  });
  y += 12;
  doc.fillColor(COLORS.text);

  // ---------- Balken-Helfer ----------
  const drawBars = (rows: Array<{ label: string; value: number; color: string }>) => {
    const maxVal = Math.max(1, ...rows.map((r) => r.value));
    const labelW = 130;
    const countW = 40;
    const barMaxW = CONTENT_WIDTH - labelW - countW - 16;
    rows.forEach((r) => {
      ensureSpace(20);
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.text).text(r.label, PAGE.margin, y + 2, {
        width: labelW,
      });
      const barX = PAGE.margin + labelW;
      // Track
      doc.roundedRect(barX, y, barMaxW, 12, 6).fill(COLORS.panelAlt);
      // Wert
      const w = Math.max(2, (r.value / maxVal) * barMaxW);
      doc.roundedRect(barX, y, w, 12, 6).fill(r.color);
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(COLORS.ink)
        .text(String(r.value), barX + barMaxW + 8, y + 1, { width: countW });
      y += 20;
    });
    y += 6;
    doc.fillColor(COLORS.text);
  };

  // ---------- Nach Status ----------
  sectionTitle('Verteilung nach Status');
  drawBars([
    { label: STATUS_LABELS.OPEN, value: byStatus.OPEN, color: STATUS_COLORS.OPEN },
    { label: STATUS_LABELS.IN_PROGRESS, value: byStatus.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
    { label: STATUS_LABELS.RESOLVED, value: byStatus.RESOLVED, color: STATUS_COLORS.RESOLVED },
    { label: STATUS_LABELS.CLOSED, value: byStatus.CLOSED, color: STATUS_COLORS.CLOSED },
  ]);

  // ---------- Nach Priorität ----------
  sectionTitle('Verteilung nach Priorität');
  drawBars([
    { label: PRIORITY_LABELS.CRITICAL, value: byPriority.CRITICAL, color: PRIORITY_COLORS.CRITICAL },
    { label: PRIORITY_LABELS.HIGH, value: byPriority.HIGH, color: PRIORITY_COLORS.HIGH },
    { label: PRIORITY_LABELS.MEDIUM, value: byPriority.MEDIUM, color: PRIORITY_COLORS.MEDIUM },
    { label: PRIORITY_LABELS.LOW, value: byPriority.LOW, color: PRIORITY_COLORS.LOW },
  ]);

  // ---------- Nach Kategorie ----------
  const categoryRows = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value], idx) => ({
      label,
      value,
      color: idx % 2 === 0 ? COLORS.brandTo : COLORS.brandFrom,
    }));
  if (categoryRows.length > 0) {
    sectionTitle('Verteilung nach Kategorie');
    drawBars(categoryRows);
  }

  // ---------- EHS-Übersicht ----------
  if (ehsCount > 0) {
    sectionTitle('EHS – Arbeitssicherheit & Gesundheit');
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.text);
    ensureSpace(18);
    doc.text(
      `${ehsCount} EHS-relevante Vorfälle · ${totalLostWorkDays} verlorene Arbeitstage gesamt`,
      PAGE.margin,
      y
    );
    y += 22;

    const ehsCatCounts: Record<string, number> = {};
    incidents
      .filter((i) => i.isEHSRelevant && i.ehsCategory)
      .forEach((i) => {
        ehsCatCounts[i.ehsCategory] = (ehsCatCounts[i.ehsCategory] || 0) + 1;
      });
    const ehsRows = Object.entries(ehsCatCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, value], idx) => ({
        label: EHS_CATEGORY_LABELS[cat] || cat,
        value,
        color: idx % 2 === 0 ? '#7c3aed' : '#a855f7',
      }));
    if (ehsRows.length > 0) drawBars(ehsRows);
  }

  // ---------- Vorfallliste (Tabelle) ----------
  sectionTitle(`Vorfallliste (${total})`);

  const cols = [
    { key: 'nr', label: 'Nr.', x: PAGE.margin, w: 52 },
    { key: 'title', label: 'Titel', x: PAGE.margin + 56, w: 175 },
    { key: 'status', label: 'Status', x: PAGE.margin + 235, w: 78 },
    { key: 'prio', label: 'Priorität', x: PAGE.margin + 317, w: 58 },
    { key: 'date', label: 'Gemeldet', x: PAGE.margin + 379, w: 52 },
    { key: 'assignee', label: 'Zuständig', x: PAGE.margin + 435, w: CONTENT_WIDTH - 435 },
  ];

  const drawTableHeader = () => {
    doc.roundedRect(PAGE.margin, y, CONTENT_WIDTH, 18, 3).fill(COLORS.ink);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.white);
    cols.forEach((c) => doc.text(c.label.toUpperCase(), c.x + 4, y + 5, { width: c.w - 6 }));
    y += 18;
    doc.fillColor(COLORS.text);
  };

  ensureSpace(40);
  drawTableHeader();

  const sorted = [...incidents].sort((a, b) => {
    const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
  });

  sorted.forEach((inc, idx) => {
    const titleText = inc.title || '';
    doc.font('Helvetica').fontSize(8.5);
    const titleH = doc.heightOfString(titleText, { width: cols[1].w - 6 });
    const rowH = Math.max(16, titleH + 8);

    if (y + rowH > MAX_Y) {
      doc.addPage();
      y = PAGE.margin;
      drawTableHeader();
    }

    // Zebra-Hintergrund
    if (idx % 2 === 1) {
      doc.rect(PAGE.margin, y, CONTENT_WIDTH, rowH).fill(COLORS.panel);
    }

    const cellY = y + 4;
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.text);
    doc.text(inc.incidentNumber || '–', cols[0].x + 4, cellY, { width: cols[0].w - 6 });
    doc.fillColor(COLORS.ink).text(titleText, cols[1].x + 4, cellY, { width: cols[1].w - 6 });

    // Status-Punkt + Text
    doc.circle(cols[2].x + 7, cellY + 4, 3).fill(STATUS_COLORS[inc.status] || COLORS.muted);
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(COLORS.text)
      .text(STATUS_LABELS[inc.status] || inc.status, cols[2].x + 14, cellY, { width: cols[2].w - 16 });

    doc
      .fillColor(PRIORITY_COLORS[inc.priority] || COLORS.text)
      .font('Helvetica-Bold')
      .text(PRIORITY_LABELS[inc.priority] || inc.priority, cols[3].x + 4, cellY, { width: cols[3].w - 6 });

    doc
      .font('Helvetica')
      .fillColor(COLORS.text)
      .text(fmtDate(inc.reportedAt), cols[4].x + 4, cellY, { width: cols[4].w - 6 });
    doc.text(inc.assignedTo ? fullName(inc.assignedTo) : '–', cols[5].x + 4, cellY, {
      width: cols[5].w - 6,
    });

    y += rowH;
    // Trennlinie
    doc.moveTo(PAGE.margin, y).lineTo(PAGE.width - PAGE.margin, y).lineWidth(0.3).stroke(COLORS.border);
  });

  // ---------- Fußzeilen ----------
  const generatedAt = fmtDateTime(new Date());
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    // Fußzeile oberhalb der Bottom-Margin-Schwelle und ohne lineBreak, damit
    // PDFKit keine automatischen (leeren) Folgeseiten anhängt.
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
        `${companyName} · Vertraulich – nur für interne Verwendung · Erstellt am ${generatedAt}`,
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
