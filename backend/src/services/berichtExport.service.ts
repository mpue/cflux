import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { PHOTOS_DIR, ReportWithRelations } from './bericht.service';

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

export const renderReportHtml = (report: ReportWithRelations): string => {
  const primary = safeColor(report.project.primaryColor, DEFAULT_BRANDING.primaryColor);
  const secondary = safeColor(report.project.secondaryColor, DEFAULT_BRANDING.secondaryColor);
  const accent = safeColor(report.project.accentColor, DEFAULT_BRANDING.accentColor);
  const logo = logoDataUri(report.project.logoUrl);
  const dateLabel = formatDate(report.date);

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Toolbox-Rundgang ${esc(report.weekday)} – ${esc(dateLabel)}</title>
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

  /* Fuer den PDF-Export: A4 quer bietet bei 0.3in Rand rund 1065px Inhalt,
     die Bildschirmbreite von 1400px wuerde rechts abgeschnitten. */
  @media print {
    @page { size: A4 landscape; }
    body { padding: 0; background: #fff; }
    table { max-width: none; width: 100%; }
    .doc-header { margin-bottom: 12px; padding-bottom: 10px; }
    .feststellungen { page-break-inside: auto; }
    .feststellungen tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="doc-header">
    <div>
      <h1>Toolbox-Rundgang · Tagesprotokoll — ${esc(report.weekday)}, ${esc(dateLabel)}</h1>
      <div class="subtitle">${esc(report.project.name)}</div>
    </div>
    ${logo ? `<img src="${logo}" alt="${esc(report.project.name)}" class="doc-logo">` : ''}
  </div>

  <table class="kopfdaten">
    <tr><td class="label">Projekt / Objekt</td><td class="value" colspan="3">${esc(report.project.name)}</td></tr>
    <tr><td class="label">Datum des Rundgangs</td><td class="value" colspan="3">${esc(dateLabel)}</td></tr>
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

  <div class="footnote">Erzeugt mit cflux · Modul Berichte.</div>
</body>
</html>`;
};

/** Rendert den Bericht ueber Gotenberg (Chromium) als A4-Querformat-PDF. */
export const renderReportPdf = async (report: ReportWithRelations): Promise<Buffer> => {
  const html = renderReportHtml(report);

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
  const project = report.project.name.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 40);
  const date = new Date(report.date).toISOString().slice(0, 10);
  return `Rundgang_${project}_${report.weekday}_${date}.${extension}`;
};
