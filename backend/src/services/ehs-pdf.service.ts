import PDFDocument from 'pdfkit';
import { PrismaClient, EHSCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface EHSReportData {
  year: number;
  month: number;
  monthlyData: any;
  incidents: any[];
  pyramid: {
    fatalities: number;
    ltis: number;
    recordables: number;
    firstAids: number;
    nearMisses: number;
    unsafeBehaviors: number;
    unsafeConditions: number;
    propertyDamages: number;
    environmentIncidents: number;
    safetyObservations: number;
  };
  kpis: {
    ltifr: number;
    trir: number;
    ytdLTIFR: number;
    ytdTRIR: number;
    totalHours: number;
    ytdTotalHours: number;
  };
}

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const formatNumber = (num: number | null | undefined, decimals: number = 2): string => {
  if (num === null || num === undefined) return '0.00';
  return num.toFixed(decimals);
};

export const generateEHSReport = async (
  year: number,
  month: number
): Promise<Buffer> => {
  // Fetch data
  const monthlyData = await prisma.eHSMonthlyData.findFirst({
    where: { year, month },
    include: { project: true }
  });

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const incidents = await prisma.incident.findMany({
    where: {
      isEHSRelevant: true,
      incidentDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      reportedBy: true,
      assignedTo: true
    },
    orderBy: {
      incidentDate: 'desc'
    }
  });

  // Calculate pyramid
  const pyramid = {
    fatalities: incidents.filter(i => i.ehsCategory === 'FATALITY').length,
    ltis: incidents.filter(i => i.ehsCategory === 'LTI').length,
    recordables: incidents.filter(i => i.ehsCategory === 'RECORDABLE').length,
    firstAids: incidents.filter(i => i.ehsCategory === 'FIRST_AID').length,
    nearMisses: incidents.filter(i => i.ehsCategory === 'NEAR_MISS').length,
    unsafeBehaviors: incidents.filter(i => i.ehsCategory === 'UNSAFE_BEHAVIOR').length,
    unsafeConditions: incidents.filter(i => i.ehsCategory === 'UNSAFE_CONDITION').length,
    propertyDamages: incidents.filter(i => i.ehsCategory === 'PROPERTY_DAMAGE').length,
    environmentIncidents: incidents.filter(i => i.ehsCategory === 'ENVIRONMENT').length,
    safetyObservations: incidents.filter(i => i.ehsCategory === 'SAFETY_OBSERVATION').length
  };

  // Calculate KPIs
  const totalHours = monthlyData?.totalHours || 0;
  const ltifr = totalHours > 0 ? (pyramid.ltis / totalHours) * 1000000 : 0;
  const recordableIncidents = pyramid.recordables + pyramid.ltis + pyramid.fatalities;
  const trir = totalHours > 0 ? (recordableIncidents / totalHours) * 200000 : 0;

  // YTD calculations
  const ytdData = await prisma.eHSMonthlyData.findMany({
    where: {
      year,
      month: { lte: month }
    }
  });

  const ytdTotalHours = ytdData.reduce((sum, d) => sum + (d.totalHours || 0), 0);
  const ytdIncidents = await prisma.incident.findMany({
    where: {
      isEHSRelevant: true,
      incidentDate: {
        gte: new Date(year, 0, 1),
        lte: endDate
      }
    }
  });

  const ytdLTIs = ytdIncidents.filter(i => i.ehsCategory === 'LTI').length;
  const ytdRecordables = ytdIncidents.filter(i => 
    i.ehsCategory === 'RECORDABLE' || i.ehsCategory === 'LTI' || i.ehsCategory === 'FATALITY'
  ).length;

  const ytdLTIFR = ytdTotalHours > 0 ? (ytdLTIs / ytdTotalHours) * 1000000 : 0;
  const ytdTRIR = ytdTotalHours > 0 ? (ytdRecordables / ytdTotalHours) * 200000 : 0;

  const kpis = {
    ltifr,
    trir,
    ytdLTIFR,
    ytdTRIR,
    totalHours,
    ytdTotalHours
  };

  // Fetch all incidents for the year (for category-month matrix)
  const yearStartDate = new Date(year, 0, 1);
  const yearEndDate = new Date(year, 11, 31, 23, 59, 59);
  const yearIncidents = await prisma.incident.findMany({
    where: {
      isEHSRelevant: true,
      ehsCategory: { not: null },
      incidentDate: {
        gte: yearStartDate,
        lte: yearEndDate
      }
    }
  });

  // Build category-month matrix
  const categoryNames: { [key: string]: string } = {
    'FATALITY': 'Tödlicher Unfall',
    'LTI': 'LTI',
    'RECORDABLE': 'Meldepflichtig',
    'FIRST_AID': 'Erste Hilfe',
    'NEAR_MISS': 'Beinahe-Unfall',
    'UNSAFE_BEHAVIOR': 'Unsicher. Verhalten',
    'UNSAFE_CONDITION': 'Unsicher. Zustand',
    'PROPERTY_DAMAGE': 'Sachschaden',
    'ENVIRONMENT': 'Umwelt',
    'SAFETY_OBSERVATION': 'Beobachtung'
  };

  interface Matrix {
    [category: string]: { [month: number]: number };
  }

  const matrix: Matrix = {};
  Object.keys(categoryNames).forEach(cat => {
    matrix[cat] = {};
    for (let m = 1; m <= 12; m++) {
      matrix[cat][m] = 0;
    }
  });

  yearIncidents.forEach(incident => {
    if (incident.ehsCategory && incident.incidentDate) {
      const incidentMonth = incident.incidentDate.getMonth() + 1;
      if (matrix[incident.ehsCategory]) {
        matrix[incident.ehsCategory][incidentMonth]++;
      }
    }
  });

  // Generate PDF
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ========== SEITE 1: TITELSEITE ==========
      doc.fontSize(36).font('Helvetica-Bold').text('EHS KPI Bericht', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(24).font('Helvetica').text(`${monthNames[month - 1]} ${year}`, { align: 'center' });
      doc.moveDown(3);
      
      // Report date centered
      doc.fontSize(12).text(`Erstellt am: ${formatDate(new Date())}`, { align: 'center' });
      
      // Company/Project info if needed
      if (monthlyData?.project) {
        doc.moveDown(2);
        doc.fontSize(14).text(`Projekt: ${monthlyData.project.name}`, { align: 'center' });
      }

      // ========== SEITE 2: ARBEITSDATEN ==========
      doc.addPage();
      doc.fontSize(20).font('Helvetica-Bold').text('Arbeitsdaten', { align: 'center' });
      doc.moveDown(1);
      
      // Separator line
      doc.moveTo(50, doc.y).lineTo(792, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica');
      
      const leftColumn = 100;
      const rightColumn = 450;
      let startY = doc.y;

      // Left column: Work data
      doc.font('Helvetica-Bold').text('Monatsdaten:', leftColumn, startY);
      doc.font('Helvetica');
      
      if (monthlyData) {
        doc.text(`Arbeitstage: ${monthlyData.workingDays || 0}`, leftColumn, doc.y + 20);
        doc.text(`Mitarbeiter pro Tag: ${monthlyData.workersPerDay || 0}`, leftColumn, doc.y + 10);
        doc.text(`Stunden pro Tag: ${monthlyData.hoursPerDay || 0}`, leftColumn, doc.y + 10);
        doc.text(`Gesamtmitarbeiter: ${monthlyData.totalEmployees || 0}`, leftColumn, doc.y + 10);
        doc.text(`Gesamtstunden: ${formatNumber(monthlyData.totalHours || 0, 0)}`, leftColumn, doc.y + 10);
      } else {
        doc.text('Keine Arbeitsdaten erfasst', leftColumn, doc.y + 20);
        doc.text('Bitte im Dashboard unter "Arbeitsdaten"', leftColumn, doc.y + 10);
        doc.text('die monatlichen Daten erfassen.', leftColumn, doc.y + 10);
      }

      // Right column: KPIs
      doc.font('Helvetica-Bold').text('Sicherheits-KPIs:', rightColumn, startY);
      doc.font('Helvetica');
      
      if (kpis.totalHours > 0) {
        doc.text(`LTIFR: ${formatNumber(kpis.ltifr)}`, rightColumn, startY + 30);
        doc.text(`TRIR: ${formatNumber(kpis.trir)}`, rightColumn, doc.y + 10);
      } else {
        doc.text('LTIFR: N/A (keine Stunden)', rightColumn, startY + 30);
        doc.text(`TRIR: N/A (keine Stunden)`, rightColumn, doc.y + 10);
      }
      
      doc.moveDown(2);
      doc.font('Helvetica-Bold').text('Jahr bis heute (YTD):', rightColumn, doc.y);
      doc.font('Helvetica');
      
      if (kpis.ytdTotalHours > 0) {
        doc.text(`LTIFR: ${formatNumber(kpis.ytdLTIFR)}`, rightColumn, doc.y + 10);
        doc.text(`TRIR: ${formatNumber(kpis.ytdTRIR)}`, rightColumn, doc.y + 10);
        doc.text(`Gesamtstunden: ${formatNumber(kpis.ytdTotalHours, 0)}`, rightColumn, doc.y + 10);
      } else {
        doc.text(`LTIFR: N/A (keine Stunden)`, rightColumn, doc.y + 10);
        doc.text(`TRIR: N/A (keine Stunden)`, rightColumn, doc.y + 10);
        doc.text(`Gesamtstunden: 0`, rightColumn, doc.y + 10);
      }

      // ========== SEITE 3: PYRAMIDE ==========
      doc.addPage();
      doc.fontSize(20).font('Helvetica-Bold').text('Sicherheitspyramide', { align: 'center' });
      doc.moveDown(1);
      
      // Separator line
      doc.moveTo(50, doc.y).lineTo(792, doc.y).stroke();
      doc.moveDown(2);

      // Work Data Section
      // Draw visual pyramid
      const pyramidData = [
        { label: 'Todesfälle', count: pyramid.fatalities, color: '#991b1b' },
        { label: 'LTI', count: pyramid.ltis, color: '#dc2626' },
        { label: 'Meldepflichtig', count: pyramid.recordables, color: '#ea580c' },
        { label: 'Erste Hilfe', count: pyramid.firstAids, color: '#f59e0b' },
        { label: 'Beinahe-Unfälle', count: pyramid.nearMisses, color: '#eab308' },
        { label: 'Unsicher. Verhalten', count: pyramid.unsafeBehaviors, color: '#84cc16' },
        { label: 'Unsicher. Zustände', count: pyramid.unsafeConditions, color: '#22c55e' },
        { label: 'Sachschäden', count: pyramid.propertyDamages, color: '#10b981' },
        { label: 'Umwelt', count: pyramid.environmentIncidents, color: '#14b8a6' },
        { label: 'Beobachtungen', count: pyramid.safetyObservations, color: '#3b82f6' }
      ];

      const pyramidStartY = doc.y;
      const pyramidCenterX = 297.5; // A4 width center
      const pyramidHeight = 280;
      const maxWidth = 300;
      const minWidth = 40;
      const levelHeight = pyramidHeight / pyramidData.length;

      pyramidData.forEach((level, index) => {
        const widthPercent = (index + 1) / pyramidData.length;
        const levelWidth = minWidth + (maxWidth - minWidth) * widthPercent;
        const x = pyramidCenterX - levelWidth / 2;
        const y = pyramidStartY + index * levelHeight;

        // Draw level rectangle
        doc.rect(x, y, levelWidth, levelHeight)
           .fillAndStroke(level.color, '#333333');

        // Add text (white color for contrast)
        doc.fillColor('#ffffff')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(level.label, x, y + levelHeight / 2 - 10, {
             width: levelWidth,
             align: 'center'
           });
        
        doc.fontSize(11)
           .font('Helvetica')
           .text(`${level.count}`, x, y + levelHeight / 2 + 2, {
             width: levelWidth,
             align: 'center'
           });
      });

      // Reset color and move below pyramid
      doc.fillColor('#000000');
      doc.y = pyramidStartY + pyramidHeight + 20;
      doc.moveDown(1);

      // ========== SEITE 4: MATRIX ==========
      doc.addPage();
      doc.fontSize(20).font('Helvetica-Bold').text('Kategorie-Monats-Übersicht', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Jahresübersicht ${year}`, { align: 'center' });
      doc.moveDown(1);
      
      // Separator line
      doc.moveTo(50, doc.y).lineTo(792, doc.y).stroke();
      doc.moveDown(1);

      // Draw table (landscape A4: 842x595 points, with 50 margin = 742 available width)
      const tableTop = doc.y;
      const colWidth = 50;  // Increased for landscape
      const rowHeight = 24;  // Slightly increased
      const startX = 50;
      
      doc.fontSize(9).font('Helvetica-Bold');

      // Header row
      doc.text('Kategorie', startX, tableTop, { width: 120, align: 'left' });
      for (let m = 1; m <= 12; m++) {
        doc.text(monthNames[m - 1].substring(0, 3), startX + 120 + (m - 1) * colWidth, tableTop, { 
          width: colWidth, 
          align: 'center' 
        });
      }
      doc.text('Total', startX + 120 + 12 * colWidth, tableTop, { width: colWidth, align: 'center' });

      // Draw header border
      doc.moveTo(startX, tableTop + rowHeight - 2)
         .lineTo(startX + 120 + 13 * colWidth, tableTop + rowHeight - 2)
         .stroke();

      let currentY = tableTop + rowHeight;
      doc.font('Helvetica');

      // Data rows
      Object.keys(categoryNames).forEach((category) => {
        const germanName = categoryNames[category];
        let rowTotal = 0;

        doc.text(germanName, startX, currentY, { width: 120, align: 'left' });

        for (let m = 1; m <= 12; m++) {
          const count = matrix[category][m];
          rowTotal += count;
          doc.text(count.toString(), startX + 120 + (m - 1) * colWidth, currentY, { 
            width: colWidth, 
            align: 'center' 
          });
        }

        doc.font('Helvetica-Bold');
        doc.text(rowTotal.toString(), startX + 120 + 12 * colWidth, currentY, { 
          width: colWidth, 
          align: 'center' 
        });
        doc.font('Helvetica');

        currentY += rowHeight;
      });

      // Totals row
      doc.moveTo(startX, currentY - 2)
         .lineTo(startX + 120 + 13 * colWidth, currentY - 2)
         .stroke();

      doc.font('Helvetica-Bold');
      doc.text('Total', startX, currentY, { width: 120, align: 'left' });

      let grandTotal = 0;
      for (let m = 1; m <= 12; m++) {
        let monthTotal = 0;
        Object.keys(categoryNames).forEach(category => {
          monthTotal += matrix[category][m];
        });
        grandTotal += monthTotal;
        doc.text(monthTotal.toString(), startX + 120 + (m - 1) * colWidth, currentY, { 
          width: colWidth, 
          align: 'center' 
        });
      }

      doc.text(grandTotal.toString(), startX + 120 + 12 * colWidth, currentY, { 
        width: colWidth, 
        align: 'center' 
      });

      doc.moveDown(2);

      // ========== SEITE 5+: VORFALLSLISTE ==========
      if (incidents.length > 0) {
        doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold').text('Vorfallsliste', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`${incidents.length} Vorfall${incidents.length !== 1 ? 'e' : ''} im ${monthNames[month - 1]} ${year}`, { align: 'center' });
        doc.moveDown(1);
        
        // Separator line
        doc.moveTo(50, doc.y).lineTo(792, doc.y).stroke();
        doc.moveDown(1);

        doc.fontSize(11).font('Helvetica');
        incidents.forEach((incident, index) => {
          if (doc.y > 480) {  // Adjusted for landscape with header
            doc.addPage();
          }

          doc.font('Helvetica-Bold').text(`${index + 1}. ${incident.title}`);
          doc.font('Helvetica');
          doc.text(`   Datum: ${incident.incidentDate ? formatDate(incident.incidentDate) : 'N/A'}`);
          doc.text(`   Kategorie: ${incident.ehsCategory || 'N/A'}`);
          doc.text(`   Schweregrad: ${incident.ehsSeverity || 'N/A'}`);
          doc.text(`   Ort: ${incident.location || 'N/A'}`);
          doc.text(`   Status: ${incident.status}`);
          
          if (incident.description) {
            doc.text(`   Beschreibung: ${incident.description.substring(0, 150)}${incident.description.length > 150 ? '...' : ''}`);
          }
          
          doc.moveDown(0.5);
        });
      }

      // Additional info
      if (monthlyData) {
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').text('Zusätzliche Informationen');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        if (monthlyData.highlights) {
          doc.font('Helvetica-Bold').text('Highlights:');
          doc.font('Helvetica').text(monthlyData.highlights, { indent: 20 });
          doc.moveDown(0.5);
        }

        if (monthlyData.achievements) {
          doc.font('Helvetica-Bold').text('Erfolge:');
          doc.font('Helvetica').text(monthlyData.achievements, { indent: 20 });
          doc.moveDown(0.5);
        }

        if (monthlyData.hotTopics) {
          doc.font('Helvetica-Bold').text('Schwerpunktthemen:');
          doc.font('Helvetica').text(monthlyData.hotTopics, { indent: 20 });
          doc.moveDown(0.5);
        }

        if (monthlyData.safetyAward) {
          doc.font('Helvetica-Bold').text('Sicherheitsauszeichnung:');
          doc.font('Helvetica').text(monthlyData.safetyAward, { indent: 20 });
          doc.moveDown(0.5);
        }

        if (monthlyData.closingRate !== null) {
          doc.font('Helvetica-Bold').text(`Abschlussquote: ${formatNumber(monthlyData.closingRate)}%`);
        }
      }

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'Dieser Bericht wurde automatisch generiert. Alle Angaben ohne Gewähr.',
        50,
        750,
        { align: 'center', width: 495 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
