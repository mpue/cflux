import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { PHOTOS_DIR, ReportWithRelations } from './bericht.service';
import {
  EHSReportSection,
  EHS_CATEGORY_LABELS,
  EHSCategoryKey,
  MONTH_NAMES,
} from './ehs.service';

/**
 * Export eines Berichts als HTML bzw. PDF.
 *
 * Layout stammt aus dem urspruenglichen Wochenbericht-Tool, die Farben und das
 * Logo kommen jetzt aber aus dem Projekt (Project.logoUrl / primaryColor /
 * secondaryColor / accentColor) und sind damit pro Projekt editierbar.
 */

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://localhost:3000';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/** Fallback-Palette (entspricht dem Original-Layout). */
const DEFAULT_BRANDING = {
  primaryColor: '#634329',
  secondaryColor: '#EFE0D3',
  accentColor: '#FFF7E0',
};

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Nur echte Hex-Farben durchlassen — der Wert landet ungequotet im CSS. */
const safeColor = (value: string | null | undefined, fallback: string): string =>
  value && HEX_COLOR.test(value.trim()) ? value.trim() : fallback;

const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

const formatDate = (value: Date | string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('de-CH');
};

const mimeForExtension = (ext: string): string => {
  switch (ext.toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
};

const fileToDataUri = (filePath: string): string | null => {
  if (!fs.existsSync(filePath)) return null;
  const mime = mimeForExtension(path.extname(filePath));
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
};

/**
 * Loest die im Projekt gespeicherte Logo-URL auf eine Datei im uploads-Ordner
 * auf. Nur Dateien unterhalb von uploads/ werden ausgeliefert.
 */
const logoDataUri = (logoUrl: string | null | undefined): string | null => {
  if (!logoUrl) return null;

  const marker = '/uploads/';
  const index = logoUrl.indexOf(marker);
  const relative = index >= 0 ? logoUrl.slice(index + marker.length) : logoUrl;

  const resolved = path.resolve(UPLOADS_DIR, relative);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    return null;
  }

  return fileToDataUri(resolved);
};

const photoDataUri = (reportId: string, filename: string | null | undefined): string | null => {
  if (!filename) return null;
  const resolved = path.resolve(PHOTOS_DIR, reportId, filename);
  if (!resolved.startsWith(path.join(PHOTOS_DIR, reportId) + path.sep)) {
    return null;
  }
  return fileToDataUri(resolved);
};

const buildAreaRows = (areas: ReportWithRelations['areas']): string => {
  const rows: string[] = [];

  for (let i = 0; i < areas.length; i += 2) {
    const left = areas[i];
    const right = areas[i + 1];
    rows.push(`
      <tr>
        <td class="label">${esc(left.name)}</td>
        <td class="status">${esc(left.status)}</td>
        <td class="label">${right ? esc(right.name) : ''}</td>
        <td class="status">${right ? esc(right.status) : ''}</td>
      </tr>`);
  }

  return rows.join('');
};

const buildFindingRows = (report: ReportWithRelations): string => {
  const photosById = new Map(report.photos.map((photo) => [photo.id, photo]));

  return report.findings
    .map((finding, index) => {
      const photo = finding.photoId ? photosById.get(finding.photoId) : undefined;
      const uri = photo ? photoDataUri(report.id, photo.filename) : null;
      const img = uri ? `<img src="${uri}" alt="Beweisfoto ${index + 1}" class="beweisfoto">` : '';

      return `
      <tr>
        <td class="pos">${index + 1}</td>
        <td>${esc(finding.feststellung)}</td>
        <td>${esc(finding.bereich)}</td>
        <td>${esc(finding.klassifizierung)}</td>
        <td class="center">${esc(finding.ampel)}</td>
        <td class="center stopp">${esc(finding.stopp)}</td>
        <td>${esc(finding.massnahme)}</td>
        <td>${esc(finding.verantwortlich)}</td>
        <td class="center">${formatDate(finding.termin)}</td>
        <td class="center">${esc(finding.status)}</td>
        <td class="center">${formatDate(finding.erledigtAm)}</td>
        <td class="center">${esc(finding.enablon)}</td>
        <td class="center">${img}</td>
      </tr>`;
    })
    .join('');
};


/** Farbskala der EHS-Pyramide, von der Spitze (schwerste Kategorie) abwaerts. */
const PYRAMID_LEVELS: { key: keyof EHSReportSection['pyramid']; label: string; color: string }[] = [
  { key: 'fatalities', label: 'Todesfälle', color: '#7f1d1d' },
  { key: 'ltis', label: 'LTI (Lost Time Injuries)', color: '#b91c1c' },
  { key: 'recordables', label: 'Meldepflichtige Unfälle', color: '#dc2626' },
  { key: 'firstAids', label: 'Erste Hilfe', color: '#ea580c' },
  { key: 'nearMisses', label: 'Beinahe-Unfälle', color: '#f59e0b' },
  { key: 'unsafeBehaviors', label: 'Unsicheres Verhalten', color: '#eab308' },
  { key: 'unsafeConditions', label: 'Unsichere Zustände', color: '#a3a635' },
  { key: 'propertyDamages', label: 'Sachschäden', color: '#65a30d' },
  { key: 'environmentIncidents', label: 'Umweltvorfälle', color: '#16a34a' },
  { key: 'safetyObservations', label: 'Sicherheitsbeobachtungen', color: '#0d9488' },
];

const formatNumber = (value: number | null | undefined, decimals = 2): string =>
  (value ?? 0).toLocaleString('de-CH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const formatInt = (value: number | null | undefined): string =>
  Math.round(value ?? 0).toLocaleString('de-CH');

/**
 * EHS-Pyramide als Inline-SVG: zehn Trapezstufen, die zusammen ein Dreieck
 * bilden — Spitze = schwerste Kategorie. Chromium rendert das im PDF genauso
 * wie am Bildschirm; CSS-Formen (clip-path, Border-Tricks) sind im Druck
 * deutlich unzuverlaessiger.
 */
const buildPyramidSvg = (pyramid: EHSReportSection['pyramid']): string => {
  const WIDTH = 790;
  const TOP = 16;
  const BAND = 50;
  const GAP = 3;
  const HALF_BASE = 235;
  const HALF_APEX = 20;
  const CX = 258;
  const LABEL_X = 530;
  const HEIGHT = TOP + PYRAMID_LEVELS.length * BAND + 16;

  /** Halbe Breite des Dreiecks auf Hoehe y — linear von Spitze zur Basis. */
  const halfWidthAt = (y: number): number => {
    const progress = (y - TOP) / (PYRAMID_LEVELS.length * BAND);
    return HALF_APEX + progress * (HALF_BASE - HALF_APEX);
  };

  const bands = PYRAMID_LEVELS.map((level, index) => {
    const count = pyramid[level.key] ?? 0;
    const yTop = TOP + index * BAND;
    const yBottom = yTop + BAND - GAP;
    const halfTop = halfWidthAt(yTop);
    const halfBottom = halfWidthAt(yBottom);
    const middle = yTop + (BAND - GAP) / 2;

    const points = [
      `${(CX - halfTop).toFixed(1)},${yTop}`,
      `${(CX + halfTop).toFixed(1)},${yTop}`,
      `${(CX + halfBottom).toFixed(1)},${yBottom}`,
      `${(CX - halfBottom).toFixed(1)},${yBottom}`,
    ].join(' ');

    return `
      <polygon points="${points}" fill="${level.color}" />
      <text x="${CX}" y="${middle}" class="ehs-pyr-num" text-anchor="middle" dominant-baseline="central">${count}</text>
      <line x1="${(CX + halfBottom + 8).toFixed(1)}" y1="${middle}" x2="${LABEL_X - 10}" y2="${middle}" class="ehs-pyr-leader" />
      <text x="${LABEL_X}" y="${middle}" class="ehs-pyr-cat" dominant-baseline="central">${esc(level.label)}</text>`;
  }).join('');

  return `
    <svg class="ehs-pyramid-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="EHS-Pyramide">
      ${bands}
    </svg>`;
};

const buildMatrixRows = (matrix: EHSReportSection['matrix']): string => {
  const rows = matrix.rows
    .map(
      (row) => `
      <tr${row.total > 0 ? ' class="has-incidents"' : ''}>
        <td class="ehs-cat">${esc(row.label)}</td>
        ${row.counts.map((count) => `<td class="center">${count > 0 ? count : '–'}</td>`).join('')}
        <td class="center total">${row.total > 0 ? row.total : '–'}</td>
      </tr>`
    )
    .join('');

  return `${rows}
      <tr class="ehs-sum">
        <td class="ehs-cat"><strong>Summe</strong></td>
        ${matrix.monthTotals
          .map((total) => `<td class="center"><strong>${total > 0 ? total : '–'}</strong></td>`)
          .join('')}
        <td class="center total"><strong>${matrix.grandTotal}</strong></td>
      </tr>`;
};

const buildIncidentRows = (incidents: EHSReportSection['incidents']): string => {
  if (incidents.length === 0) {
    return '<tr><td colspan="5" class="center">Keine Vorfälle in diesem Monat</td></tr>';
  }

  return incidents
    .map((incident: any) => {
      const category = EHS_CATEGORY_LABELS[incident.ehsCategory as EHSCategoryKey];

      return `
      <tr>
        <td class="center">${formatDate(incident.incidentDate ?? incident.reportedAt)}</td>
        <td>${esc(category ?? incident.ehsCategory)}</td>
        <td>${esc(incident.title ? `${incident.title} — ${incident.description ?? ''}` : incident.description)}</td>
        <td class="center">${esc(incident.ehsSeverity)}</td>
        <td class="center">${esc(incident.status)}</td>
      </tr>`;
    })
    .join('');
};

/** Freitextfelder aus den EHS-Monatsdaten, nur wenn gepflegt. */
const buildNotesRows = (monthlyData: EHSReportSection['monthlyData']): string => {
  if (!monthlyData) return '';

  const fields: [string, string | null][] = [
    ['Highlights', monthlyData.highlights],
    ['Erfolge', monthlyData.achievements],
    ['Brennende Themen', monthlyData.hotTopics],
    ['Safety Award', monthlyData.safetyAward],
  ];

  const rows = fields
    .filter(([, value]) => value && value.trim() !== '')
    .map(([label, value]) => `<tr><td class="label">${esc(label)}</td><td class="value">${esc(value)}</td></tr>`)
    .join('');

  if (!rows) return '';

  return `
  <table class="kopfdaten ehs-notes">
    <tr><td colspan="2" class="section-header">Anmerkungen zum Monat</td></tr>
    ${rows}
  </table>`;
};

/**
 * EHS-Auswertung als Anhang hinter dem Rundgangsprotokoll — Inhalt entspricht
 * dem frueheren EHS-Dashboard (Arbeitsdaten, KPIs, Pyramide, Jahresmatrix,
 * Vorfaelle des Monats).
 */
const buildEhsSection = (ehs: EHSReportSection): string => {
  const monthLabel = `${MONTH_NAMES[ehs.month - 1]} ${ehs.year}`;
  const scope = ehs.project ? ehs.project.name : 'Alle Projekte';
  const monthly = ehs.monthlyData;

  return `
  <div class="ehs-section">
    <h2 class="ehs-title">EHS-Auswertung — ${esc(monthLabel)}</h2>
    <div class="ehs-scope">Auswertungsbereich: ${esc(scope)}</div>

    <table class="kopfdaten">
      <tr><td colspan="4" class="section-header">Arbeitsdaten ${esc(monthLabel)}</td></tr>
      <tr>
        <td class="label">Arbeitstage</td><td class="value">${formatInt(monthly?.workingDays)}</td>
        <td class="label">Arbeiter pro Tag</td><td class="value">${formatInt(monthly?.workersPerDay)}</td>
      </tr>
      <tr>
        <td class="label">Stunden pro Tag</td><td class="value">${formatNumber(monthly?.hoursPerDay, 1)}</td>
        <td class="label">Gesamtstunden</td><td class="value">${formatInt(ehs.kpis.totalHours)}</td>
      </tr>
    </table>

    <table class="ehs-kpis">
      <tr><td colspan="4" class="section-header">Kennzahlen</td></tr>
      <tr>
        <td><div class="ehs-kpi-label">LTIFR (Monat)</div><div class="ehs-kpi-value">${formatNumber(ehs.kpis.ltifr)}</div><div class="ehs-kpi-hint">Lost Time Injury Frequency Rate</div></td>
        <td><div class="ehs-kpi-label">TRIR (Monat)</div><div class="ehs-kpi-value">${formatNumber(ehs.kpis.trir)}</div><div class="ehs-kpi-hint">Total Recordable Injury Rate</div></td>
        <td><div class="ehs-kpi-label">LTIFR (YTD)</div><div class="ehs-kpi-value">${formatNumber(ehs.kpis.ytdLTIFR)}</div><div class="ehs-kpi-hint">Jahr bis ${esc(MONTH_NAMES[ehs.month - 1])}</div></td>
        <td><div class="ehs-kpi-label">TRIR (YTD)</div><div class="ehs-kpi-value">${formatNumber(ehs.kpis.ytdTRIR)}</div><div class="ehs-kpi-hint">Jahr bis ${esc(MONTH_NAMES[ehs.month - 1])}</div></td>
      </tr>
      <tr>
        <td colspan="4" class="ehs-kpi-foot">
          Gesamtstunden Monat: ${formatInt(ehs.kpis.totalHours)} · YTD: ${formatInt(ehs.kpis.ytdTotalHours)}
          ${ehs.kpis.totalHours === 0 ? ' · <strong>Ohne gepflegte Arbeitsstunden bleiben LTIFR und TRIR 0.</strong>' : ''}
        </td>
      </tr>
    </table>

    <div class="ehs-pyramid">
      <div class="section-header">EHS-Pyramide ${esc(monthLabel)}</div>
      <div class="ehs-pyramid-body">${buildPyramidSvg(ehs.pyramid)}</div>
    </div>

    <table class="ehs-matrix">
      <tr><td colspan="14" class="section-header">Jahresübersicht ${ehs.year} — Vorfälle nach Kategorie und Monat</td></tr>
      <tr>
        <th>Kategorie</th>
        ${MONTH_NAMES.map((name) => `<th>${esc(name.substring(0, 3))}</th>`).join('')}
        <th>Gesamt</th>
      </tr>
      ${buildMatrixRows(ehs.matrix)}
    </table>

    <table class="ehs-incidents">
      <tr><td colspan="5" class="section-header">Vorfälle im Monat (${ehs.incidents.length})</td></tr>
      <tr><th>Datum</th><th>Kategorie</th><th>Beschreibung</th><th>Schweregrad</th><th>Status</th></tr>
      ${buildIncidentRows(ehs.incidents)}
    </table>

    ${buildNotesRows(ehs.monthlyData)}
  </div>`;
};

export const renderReportHtml = (
  report: ReportWithRelations,
  ehs: EHSReportSection | null = null
): string => {
  const primary = safeColor(report.project.primaryColor, DEFAULT_BRANDING.primaryColor);
  const secondary = safeColor(report.project.secondaryColor, DEFAULT_BRANDING.secondaryColor);
  const accent = safeColor(report.project.accentColor, DEFAULT_BRANDING.accentColor);
  const logo = logoDataUri(report.project.logoUrl);
  const dateLabel = formatDate(report.date);
  // Ein gepflegter Titel ersetzt die Standardzeile, so wie im Quelltool.
  const heading = report.titel?.trim()
    ? report.titel.trim()
    : `Toolbox-Rundgang · Tagesprotokoll — ${report.weekday}, ${dateLabel}`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${esc(heading)}</title>
<style>
  body {
    font-family: Calibri, Arial, sans-serif;
    background: #f4f1ec;
    padding: 24px;
    color: #1a1a1a;
  }
  h1 { font-size: 16pt; margin: 0 0 4px; }
  .subtitle { font-size: 10pt; color: ${primary}; }
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    border-bottom: 3px solid ${primary};
    padding-bottom: 14px;
    margin-bottom: 20px;
  }
  .doc-logo { height: 38px; width: auto; flex-shrink: 0; margin-top: 2px; }
  table { border-collapse: collapse; width: 100%; max-width: 1400px; background: #fff; margin-bottom: 20px; }
  td, th { border: 1px solid #d9d0c3; padding: 5px 7px; font-size: 9pt; vertical-align: top; }
  .section-header { background: ${primary}; color: #fff; font-weight: bold; font-size: 10.5pt; padding: 6px 8px; }
  .kopfdaten td.label { background: ${secondary}; font-weight: bold; width: 220px; }
  .kopfdaten td.value { background: ${accent}; }
  .bereiche td.label { width: 30%; }
  .bereiche td.status { background: ${accent}; text-align: center; width: 20%; }
  .feststellungen th { background: ${primary}; color: #fff; text-align: center; font-size: 8pt; }
  .feststellungen td { font-size: 8.5pt; }
  .feststellungen td.pos { text-align: center; }
  .feststellungen td.center { text-align: center; }
  .beweisfoto { max-width: 110px; max-height: 110px; display: block; margin: 0 auto; }
  .footnote { font-size: 8pt; color: #666; margin-top: 8px; }

  /* ---- EHS-Auswertung (Anhang) ---- */
  .ehs-section { page-break-before: always; }
  .ehs-title { font-size: 14pt; margin: 0 0 2px; color: ${primary}; }
  .ehs-scope { font-size: 9pt; color: #555; margin-bottom: 14px; }
  .ehs-kpis td { text-align: center; background: ${accent}; }
  /* Der Abschnittskopf darf nicht von der Kachel-Faerbung ueberschrieben werden. */
  .ehs-kpis td.section-header { background: ${primary}; color: #fff; text-align: left; }
  .ehs-kpi-label { font-size: 8.5pt; color: #555; }
  .ehs-kpi-value { font-size: 18pt; font-weight: bold; color: ${primary}; line-height: 1.2; }
  .ehs-kpi-hint { font-size: 7.5pt; color: #777; }
  .ehs-kpis td.ehs-kpi-foot { background: #fff; text-align: left; font-size: 8pt; color: #555; }
  .ehs-pyramid { background: #fff; border: 1px solid #d9d0c3; margin-bottom: 20px; }
  .ehs-pyramid-body { padding: 10px 12px; }
  .ehs-pyramid-svg { display: block; width: 100%; height: auto; max-width: 620px; margin: 0 auto; }
  .ehs-pyr-num { fill: #fff; font-size: 17px; font-weight: bold; }
  .ehs-pyr-cat { fill: #1a1a1a; font-size: 17px; }
  .ehs-pyr-leader { stroke: #cfc6b8; stroke-width: 1; }
  .ehs-matrix th { background: ${primary}; color: #fff; text-align: center; font-size: 8pt; }
  .ehs-matrix td { font-size: 8.5pt; }
  .ehs-matrix td.ehs-cat { width: 200px; }
  .ehs-matrix td.center { text-align: center; }
  .ehs-matrix td.total { background: ${accent}; font-weight: bold; }
  .ehs-matrix tr.has-incidents td.ehs-cat { font-weight: bold; }
  .ehs-matrix tr.ehs-sum td { background: ${secondary}; }
  .ehs-incidents th { background: ${primary}; color: #fff; text-align: center; font-size: 8pt; }
  .ehs-incidents td { font-size: 8.5pt; }
  .ehs-incidents td.center { text-align: center; }

  /* Fuer den PDF-Export: A4 quer bietet bei 0.3in Rand rund 1065px Inhalt,
     die Bildschirmbreite von 1400px wuerde rechts abgeschnitten. */
  @media print {
    @page { size: A4 landscape; }
    body { padding: 0; background: #fff; }
    table { max-width: none; width: 100%; }
    .doc-header { margin-bottom: 12px; padding-bottom: 10px; }
    .feststellungen { page-break-inside: auto; }
    .feststellungen tr { page-break-inside: avoid; }
    .ehs-section table { page-break-inside: auto; }
    .ehs-section tr { page-break-inside: avoid; }
    .ehs-pyramid { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="doc-header">
    <div>
      <h1>${esc(heading)}</h1>
      <div class="subtitle">${esc(report.project.name)}${
        report.ordner ? ` · ${esc(report.ordner)}` : ''
      }</div>
    </div>
    ${logo ? `<img src="${logo}" alt="${esc(report.project.name)}" class="doc-logo">` : ''}
  </div>

  <table class="kopfdaten">
    <tr><td class="label">Projekt / Objekt</td><td class="value" colspan="3">${esc(report.project.name)}</td></tr>
    <tr><td class="label">Datum des Rundgangs</td><td class="value" colspan="3">${esc(dateLabel)} (${esc(report.weekday)})</td></tr>
    ${
      report.ordner
        ? `<tr><td class="label">Wochenbericht / Ordner</td><td class="value" colspan="3">${esc(report.ordner)}</td></tr>`
        : ''
    }
    <tr><td class="label">Referent / CM</td><td class="value" colspan="3">${esc(report.referent)}</td></tr>
    <tr><td class="label">Rundgang durchgeführt (Ja/Nein)</td><td class="value" colspan="3">${esc(report.rundgangDurchgefuehrt)}</td></tr>
    <tr><td class="label">Weitere Teilnehmer (Name / Firma)</td><td class="value" colspan="3">${esc(report.weitereTeilnehmer)}</td></tr>
  </table>

  <table class="bereiche">
    <tr><td colspan="4" class="section-header">Kontrollierte Bereiche (Status: i.O. / Abweichung / nicht geprüft)</td></tr>
    ${buildAreaRows(report.areas)}
  </table>

  <table class="feststellungen">
    <tr><td colspan="13" class="section-header">Feststellungen · Klassifizierung · Massnahmen · Beweisfoto</td></tr>
    <tr>
      <th>Pos.</th><th>Feststellung</th><th>Bereich</th><th>Klassifizierung</th><th>Ampel</th><th>Stopp</th>
      <th>Massnahme</th><th>Verantwortlich</th><th>Termin</th><th>Status</th><th>Erledigt am</th><th>Enablon</th><th>Beweisfoto</th>
    </tr>
    ${buildFindingRows(report) || '<tr><td colspan="13" class="center">Keine Feststellungen erfasst</td></tr>'}
  </table>

  ${ehs ? buildEhsSection(ehs) : ''}

  <div class="footnote">Erzeugt mit cflux · Modul Berichte.</div>
</body>
</html>`;
};

/** Rendert den Bericht ueber Gotenberg (Chromium) als A4-Querformat-PDF. */
export const renderReportPdf = async (
  report: ReportWithRelations,
  ehs: EHSReportSection | null = null
): Promise<Buffer> => {
  const html = renderReportHtml(report, ehs);

  const form = new FormData();
  form.append('files', Buffer.from(html, 'utf-8'), {
    filename: 'index.html',
    contentType: 'text/html',
  });
  // Achtung: 'landscape' TAUSCHT die Seitenmasse. Hier stehen deshalb die
  // A4-Hochformat-Masse — Chromium dreht sie auf 297x210mm (Querformat).
  form.append('landscape', 'true');
  form.append('paperWidth', '8.27');
  form.append('paperHeight', '11.69');
  form.append('marginTop', '0.4');
  form.append('marginBottom', '0.4');
  form.append('marginLeft', '0.3');
  form.append('marginRight', '0.3');
  form.append('printBackground', 'true');

  const response = await axios.post(`${GOTENBERG_URL}/forms/chromium/convert/html`, form, {
    headers: form.getHeaders(),
    responseType: 'arraybuffer',
    timeout: 60000,
  });

  return Buffer.from(response.data);
};

/** Dateiname fuer den Download, ohne Sonderzeichen. */
export const exportFilename = (report: ReportWithRelations, extension: string): string => {
  const date = new Date(report.date).toISOString().slice(0, 10);
  const ascii = (value: string) => value.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 40);

  if (report.titel?.trim()) {
    return `${ascii(report.titel.trim())}_${date}.${extension}`;
  }

  return `Rundgang_${ascii(report.project.name)}_${report.weekday}_${date}.${extension}`;
};
