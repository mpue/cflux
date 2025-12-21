import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ReportData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber?: string;
    weeklyHours?: number;
    contractHours?: number;
    canton?: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  timeEntries: any[];
  absences: any[];
  summary: {
    totalHours: number;
    totalDays: number;
    totalAbsenceDays: number;
    byProject: Array<{ name: string; hours: number }>;
    byLocation: Array<{ name: string; hours: number }>;
    dailyBreakdown: Array<{ date: string; hours: number; projects: string[] }>;
  };
  complianceInfo?: {
    expectedHours: number;
    actualHours: number;
    difference: number;
    weeklyBreakdown: Array<{ week: string; hours: number; compliant: boolean }>;
  };
}

const calculateWorkHours = (clockIn: Date, clockOut: Date | null, pauseMinutes?: number): number => {
  if (!clockOut) return 0;
  const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  const pauseHours = (pauseMinutes || 0) / 60;
  return Math.max(0, hours - pauseHours);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

export const generateUserReport = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  includeDetailed: boolean = true
): Promise<Buffer> => {
  // Fetch all data
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      clockIn: {
        gte: startDate,
        lte: endDate
      },
      status: 'CLOCKED_OUT'
    },
    include: {
      project: true,
      location: true
    },
    orderBy: {
      clockIn: 'asc'
    }
  });

  const absences = await prisma.absenceRequest.findMany({
    where: {
      userId,
      status: 'APPROVED',
      startDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Calculate summary
  const totalHours = timeEntries.reduce((sum, entry) => {
    return sum + calculateWorkHours(entry.clockIn, entry.clockOut, entry.pauseMinutes || 0);
  }, 0);

  const byProject: Record<string, { name: string; hours: number }> = {};
  const byLocation: Record<string, { name: string; hours: number }> = {};
  
  timeEntries.forEach(entry => {
    const hours = calculateWorkHours(entry.clockIn, entry.clockOut, entry.pauseMinutes || 0);
    
    if (entry.project) {
      if (!byProject[entry.project.id]) {
        byProject[entry.project.id] = { name: entry.project.name, hours: 0 };
      }
      byProject[entry.project.id].hours += hours;
    }
    
    if (entry.location) {
      if (!byLocation[entry.location.id]) {
        byLocation[entry.location.id] = { name: entry.location.name, hours: 0 };
      }
      byLocation[entry.location.id].hours += hours;
    }
  });

  // Daily breakdown
  const dailyMap: Record<string, { hours: number; projects: Set<string> }> = {};
  timeEntries.forEach(entry => {
    const dateKey = formatDate(entry.clockIn);
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { hours: 0, projects: new Set() };
    }
    dailyMap[dateKey].hours += calculateWorkHours(entry.clockIn, entry.clockOut, entry.pauseMinutes || 0);
    if (entry.project) {
      dailyMap[dateKey].projects.add(entry.project.name);
    }
  });

  const dailyBreakdown = Object.entries(dailyMap).map(([date, data]) => ({
    date,
    hours: data.hours,
    projects: Array.from(data.projects)
  }));

  // Compliance info
  let complianceInfo: ReportData['complianceInfo'];
  if (user.weeklyHours) {
    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const expectedHours = user.weeklyHours * weeks;
    
    // Calculate weekly breakdown
    const weeklyMap: Record<string, number> = {};
    timeEntries.forEach(entry => {
      const weekStart = new Date(entry.clockIn);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      const weekKey = formatDate(weekStart);
      
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = 0;
      }
      weeklyMap[weekKey] += calculateWorkHours(entry.clockIn, entry.clockOut, entry.pauseMinutes || 0);
    });

    const weeklyBreakdown = Object.entries(weeklyMap).map(([week, hours]) => ({
      week,
      hours,
      compliant: user.weeklyHours ? hours <= user.weeklyHours * 1.1 : true // 10% tolerance
    }));

    complianceInfo = {
      expectedHours,
      actualHours: totalHours,
      difference: totalHours - expectedHours,
      weeklyBreakdown
    };
  }

  const totalAbsenceDays = absences.reduce((sum, req) => sum + req.days, 0);

  const reportData: ReportData = {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeNumber: user.employeeNumber || undefined,
      weeklyHours: user.weeklyHours || undefined,
      contractHours: user.contractHours || undefined,
      canton: user.canton || undefined
    },
    period: { startDate, endDate },
    timeEntries,
    absences,
    summary: {
      totalHours,
      totalDays: totalHours / 8,
      totalAbsenceDays,
      byProject: Object.values(byProject),
      byLocation: Object.values(byLocation),
      dailyBreakdown
    },
    complianceInfo
  };

  return generatePDF(reportData, includeDetailed);
};

const generatePDF = (data: ReportData, includeDetailed: boolean): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: `Arbeitszeitbericht - ${data.user.firstName} ${data.user.lastName}`,
        Author: 'CFlux Time Tracking System',
        Subject: `Bericht ${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}`
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Arbeitszeitbericht', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(
      `${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // User info
    doc.fontSize(14).font('Helvetica-Bold').text('Mitarbeiterdaten');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    const userInfo = [
      ['Name:', `${data.user.firstName} ${data.user.lastName}`],
      ['E-Mail:', data.user.email],
      ...(data.user.employeeNumber ? [['Personalnummer:', data.user.employeeNumber]] : []),
      ...(data.user.weeklyHours ? [['Wochenstunden:', `${data.user.weeklyHours}h`]] : []),
      ...(data.user.canton ? [['Kanton:', data.user.canton]] : [])
    ];

    userInfo.forEach(([label, value]) => {
      doc.text(label, 50, doc.y, { continued: true, width: 150 });
      doc.text(value, 200, doc.y);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // Summary
    doc.fontSize(14).font('Helvetica-Bold').text('Zusammenfassung');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    const summaryInfo = [
      ['Gesamtstunden:', formatHours(data.summary.totalHours)],
      ['Arbeitstage (à 8h):', data.summary.totalDays.toFixed(1)],
      ['Abwesenheitstage:', data.summary.totalAbsenceDays.toString()],
      ['Anzahl Zeiteinträge:', data.timeEntries.length.toString()]
    ];

    summaryInfo.forEach(([label, value]) => {
      doc.text(label, 50, doc.y, { continued: true, width: 150 });
      doc.font('Helvetica-Bold').text(value, 200, doc.y);
      doc.font('Helvetica');
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // Project breakdown
    if (data.summary.byProject.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Stunden nach Projekt');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      data.summary.byProject
        .sort((a, b) => b.hours - a.hours)
        .forEach((project) => {
          const percentage = ((project.hours / data.summary.totalHours) * 100).toFixed(1);
          doc.text(project.name, 50, doc.y, { continued: true, width: 250 });
          doc.text(`${formatHours(project.hours)} (${percentage}%)`, 310, doc.y, { width: 200 });
          doc.moveDown(0.3);
        });

      doc.moveDown(1);
    }

    // Location breakdown
    if (data.summary.byLocation.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Stunden nach Standort');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      data.summary.byLocation
        .sort((a, b) => b.hours - a.hours)
        .forEach((location) => {
          const percentage = ((location.hours / data.summary.totalHours) * 100).toFixed(1);
          doc.text(location.name, 50, doc.y, { continued: true, width: 250 });
          doc.text(`${formatHours(location.hours)} (${percentage}%)`, 310, doc.y, { width: 200 });
          doc.moveDown(0.3);
        });

      doc.moveDown(1);
    }

    // Compliance info
    if (data.complianceInfo) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Arbeitszeit-Compliance');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const complianceColor = data.complianceInfo.difference >= 0 ? 'black' : 'red';
      
      doc.text('Soll-Stunden:', 50, doc.y, { continued: true, width: 150 });
      doc.text(formatHours(data.complianceInfo.expectedHours), 200, doc.y);
      doc.moveDown(0.3);
      
      doc.text('Ist-Stunden:', 50, doc.y, { continued: true, width: 150 });
      doc.text(formatHours(data.complianceInfo.actualHours), 200, doc.y);
      doc.moveDown(0.3);
      
      doc.text('Differenz:', 50, doc.y, { continued: true, width: 150 });
      doc.fillColor(complianceColor).text(
        `${data.complianceInfo.difference >= 0 ? '+' : ''}${formatHours(Math.abs(data.complianceInfo.difference))}`,
        200,
        doc.y
      );
      doc.fillColor('black');
      doc.moveDown(1);

      // Weekly breakdown
      if (data.complianceInfo.weeklyBreakdown.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Wöchentliche Übersicht');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');

        // Table header
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Woche', 50, tableTop, { width: 100 });
        doc.text('Stunden', 180, tableTop, { width: 100 });
        doc.text('Status', 310, tableTop, { width: 100 });
        doc.moveDown(0.5);
        
        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(0.3);
        
        doc.font('Helvetica');
        data.complianceInfo.weeklyBreakdown.forEach((week) => {
          doc.text(week.week, 50, doc.y, { width: 120 });
          doc.text(formatHours(week.hours), 180, doc.y, { width: 120 });
          doc.fillColor(week.compliant ? 'green' : 'red')
            .text(week.compliant ? '✓ Konform' : '✗ Überschritten', 310, doc.y, { width: 120 });
          doc.fillColor('black');
          doc.moveDown(0.3);
        });
      }
    }

    // Daily breakdown
    if (data.summary.dailyBreakdown.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Tägliche Übersicht');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Datum', 50, doc.y, { width: 100 });
      doc.text('Stunden', 130, doc.y, { width: 80 });
      doc.text('Projekte', 220, doc.y, { width: 280 });
      doc.moveDown(0.5);
      
      doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(0.3);
      
      doc.font('Helvetica');
      data.summary.dailyBreakdown.forEach((day) => {
        const yPos = doc.y;
        
        // Calculate text heights
        const dateHeight = doc.heightOfString(day.date, { width: 80 });
        const hoursHeight = doc.heightOfString(formatHours(day.hours), { width: 80 });
        const projectsHeight = doc.heightOfString(day.projects.join(', '), { width: 280 });
        const maxHeight = Math.max(dateHeight, hoursHeight, projectsHeight);
        
        // Render text
        doc.text(day.date, 50, yPos, { width: 80 });
        doc.text(formatHours(day.hours), 130, yPos, { width: 80 });
        doc.text(day.projects.join(', '), 220, yPos, { width: 280 });
        
        // Move down by the maximum height plus spacing
        doc.y = yPos + maxHeight + 3;
        
        // Add page break if needed
        if (doc.y > 700) {
          doc.addPage();
          doc.fontSize(9).font('Helvetica');
        }
      });
    }

    // Absences
    if (data.absences.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Abwesenheiten');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Von', 50, doc.y, { width: 80 });
      doc.text('Bis', 140, doc.y, { width: 80 });
      doc.text('Typ', 230, doc.y, { width: 120 });
      doc.text('Tage', 360, doc.y, { width: 60 });
      doc.moveDown(0.5);
      
      doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(0.3);
      
      doc.font('Helvetica');
      data.absences.forEach((absence) => {
        const yPos = doc.y;
        doc.text(formatDate(new Date(absence.startDate)), 50, yPos, { width: 80 });
        doc.text(formatDate(new Date(absence.endDate)), 140, yPos, { width: 80 });
        
        const typeMap: Record<string, string> = {
          VACATION: 'Urlaub',
          SICK_LEAVE: 'Krankheit',
          PERSONAL_LEAVE: 'Persönlich',
          UNPAID_LEAVE: 'Unbezahlt',
          OTHER: 'Sonstiges'
        };
        doc.text(typeMap[absence.type] || absence.type, 230, yPos, { width: 120 });
        doc.text(absence.days.toString(), 360, yPos, { width: 60 });
        doc.moveDown(0.4);
        
        if (doc.y > 700) {
          doc.addPage();
          doc.fontSize(9).font('Helvetica');
        }
      });
    }

    // Detailed time entries
    if (includeDetailed && data.timeEntries.length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Detaillierte Zeiteinträge');
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica');

      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Datum', 50, doc.y, { width: 60 });
      doc.text('Von', 115, doc.y, { width: 40 });
      doc.text('Bis', 160, doc.y, { width: 40 });
      doc.text('Pause', 205, doc.y, { width: 40 });
      doc.text('Std.', 250, doc.y, { width: 40 });
      doc.text('Projekt', 295, doc.y, { width: 100 });
      doc.text('Standort', 400, doc.y, { width: 100 });
      doc.moveDown(0.5);
      
      doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(0.3);
      
      doc.font('Helvetica');
      data.timeEntries.forEach((entry) => {
        const yPos = doc.y;
        const hours = calculateWorkHours(entry.clockIn, entry.clockOut, entry.pauseMinutes || 0);
        
        doc.text(formatDate(entry.clockIn), 50, yPos, { width: 60 });
        doc.text(formatTime(entry.clockIn), 115, yPos, { width: 40 });
        doc.text(entry.clockOut ? formatTime(entry.clockOut) : '-', 160, yPos, { width: 40 });
        doc.text(entry.pauseMinutes ? `${entry.pauseMinutes}m` : '-', 205, yPos, { width: 40 });
        doc.text(formatHours(hours), 250, yPos, { width: 40 });
        doc.text(entry.project?.name || '-', 295, yPos, { width: 100 });
        doc.text(entry.location?.name || '-', 400, yPos, { width: 100 });
        doc.moveDown(0.4);
        
        if (doc.y > 750) {
          doc.addPage();
          doc.fontSize(8).font('Helvetica');
        }
      });
    }

    // Footer
    doc.fontSize(8).text(
      `Erstellt am ${formatDate(new Date())} um ${formatTime(new Date())}`,
      50,
      750,
      { align: 'center' }
    );

    doc.end();
  });
};
