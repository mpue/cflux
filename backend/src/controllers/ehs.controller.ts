import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient, Incident } from '@prisma/client';
import { generateEHSReport } from '../services/ehs-pdf.service';

const prisma = new PrismaClient();

// Get EHS KPI Dashboard Data
export const getEHSKPIDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month, projectId } = req.query;

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    // Get monthly data
    const monthlyData = await prisma.eHSMonthlyData.findFirst({
      where: {
        year: currentYear,
        month: currentMonth,
        projectId: projectId as string || null,
      },
      include: {
        project: true,
      },
    });

    // Get incidents for the month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const incidents = await prisma.incident.findMany({
      where: {
        isEHSRelevant: true,
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(projectId && { projectId: projectId as string }),
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: true,
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });

    // Calculate EHS Pyramid
    const pyramid = {
      fatalities: incidents.filter((i: Incident) => i.ehsCategory === 'FATALITY').length,
      ltis: incidents.filter((i: Incident) => i.ehsCategory === 'LTI').length,
      recordables: incidents.filter((i: Incident) => i.ehsCategory === 'RECORDABLE').length,
      firstAids: incidents.filter((i: Incident) => i.ehsCategory === 'FIRST_AID').length,
      nearMisses: incidents.filter((i: Incident) => i.ehsCategory === 'NEAR_MISS').length,
      unsafeBehaviors: incidents.filter((i: Incident) => i.ehsCategory === 'UNSAFE_BEHAVIOR').length,
      unsafeConditions: incidents.filter((i: Incident) => i.ehsCategory === 'UNSAFE_CONDITION').length,
      propertyDamages: incidents.filter((i: Incident) => i.ehsCategory === 'PROPERTY_DAMAGE').length,
      environmentIncidents: incidents.filter((i: Incident) => i.ehsCategory === 'ENVIRONMENT').length,
      safetyObservations: incidents.filter((i: Incident) => i.ehsCategory === 'SAFETY_OBSERVATION').length,
    };

    // Calculate KPIs
    const totalHours = monthlyData?.totalHours || 0;
    const ltifr = totalHours > 0 ? (pyramid.ltis / totalHours) * 1000000 : 0;
    const trir = totalHours > 0 ? (pyramid.recordables / totalHours) * 200000 : 0;

    // Get year-to-date data
    const ytdData = await prisma.eHSMonthlyData.findMany({
      where: {
        year: currentYear,
        month: { lte: currentMonth },
        projectId: projectId as string || null,
      },
      orderBy: {
        month: 'asc',
      },
    });

    const ytdTotalHours = ytdData.reduce((sum: number, d: any) => sum + d.totalHours, 0);
    const ytdLTIs = ytdData.reduce((sum: number, d: any) => sum + d.ltis, 0);
    const ytdRecordables = ytdData.reduce((sum: number, d: any) => sum + d.recordables, 0);
    const ytdLTIFR = ytdTotalHours > 0 ? (ytdLTIs / ytdTotalHours) * 1000000 : 0;
    const ytdTRIR = ytdTotalHours > 0 ? (ytdRecordables / ytdTotalHours) * 200000 : 0;

    res.json({
      monthlyData,
      incidents,
      pyramid,
      kpis: {
        ltifr,
        trir,
        ytdLTIFR,
        ytdTRIR,
        totalHours,
        ytdTotalHours,
      },
      ytdData,
    });
  } catch (error) {
    console.error('Error fetching EHS KPI dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch EHS KPI dashboard' });
  }
};

// Get EHS Statistics
export const getEHSStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { startYear, endYear, projectId } = req.query;

    const startYearInt = startYear ? parseInt(startYear as string) : new Date().getFullYear() - 2;
    const endYearInt = endYear ? parseInt(endYear as string) : new Date().getFullYear();

    const monthlyData = await prisma.eHSMonthlyData.findMany({
      where: {
        year: {
          gte: startYearInt,
          lte: endYearInt,
        },
        projectId: projectId as string || null,
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
      ],
    });

    // Group by year
    const yearlyStats: any = {};
    monthlyData.forEach((data: any) => {
      if (!yearlyStats[data.year]) {
        yearlyStats[data.year] = {
          year: data.year,
          totalHours: 0,
          ltis: 0,
          recordables: 0,
          fatalities: 0,
          nearMisses: 0,
          unsafeConditions: 0,
          unsafeBehaviors: 0,
          firstAids: 0,
          propertyDamages: 0,
          environmentIncidents: 0,
          safetyObservations: 0,
          months: [],
        };
      }

      yearlyStats[data.year].totalHours += data.totalHours;
      yearlyStats[data.year].ltis += data.ltis;
      yearlyStats[data.year].recordables += data.recordables;
      yearlyStats[data.year].fatalities += data.fatalities;
      yearlyStats[data.year].nearMisses += data.nearMisses;
      yearlyStats[data.year].unsafeConditions += data.unsafeConditions;
      yearlyStats[data.year].unsafeBehaviors += data.unsafeBehaviors;
      yearlyStats[data.year].firstAids += data.firstAids;
      yearlyStats[data.year].propertyDamages += data.propertyDamages;
      yearlyStats[data.year].environmentIncidents += data.environmentIncidents;
      yearlyStats[data.year].safetyObservations += data.safetyObservations;
      yearlyStats[data.year].months.push(data);
    });

    // Calculate KPIs for each year
    Object.values(yearlyStats).forEach((year: any) => {
      year.ltifr = year.totalHours > 0 ? (year.ltis / year.totalHours) * 1000000 : 0;
      year.trir = year.totalHours > 0 ? (year.recordables / year.totalHours) * 200000 : 0;
    });

    res.json({
      monthlyData,
      yearlyStats: Object.values(yearlyStats),
    });
  } catch (error) {
    console.error('Error fetching EHS statistics:', error);
    res.status(500).json({ error: 'Failed to fetch EHS statistics' });
  }
};

// Update Monthly Data
export const updateMonthlyData = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month, projectId, ...data } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const monthlyData = await prisma.eHSMonthlyData.upsert({
      where: {
        year_month_projectId: {
          year: parseInt(year),
          month: parseInt(month),
          projectId: projectId || null,
        },
      },
      update: data,
      create: {
        year: parseInt(year),
        month: parseInt(month),
        projectId,
        ...data,
      },
    });

    res.json(monthlyData);
  } catch (error) {
    console.error('Error updating monthly data:', error);
    res.status(500).json({ error: 'Failed to update monthly data' });
  }
};

// Calculate and Update KPIs for a month (aggregates from incidents)
export const calculateMonthlyKPIs = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month, projectId } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all EHS incidents for the month
    const incidents = await prisma.incident.findMany({
      where: {
        isEHSRelevant: true,
        incidentDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(projectId && { projectId }),
      },
    });

    // Count by category
    const unsafeConditions = incidents.filter((i: Incident) => i.ehsCategory === 'UNSAFE_CONDITION').length;
    const unsafeBehaviors = incidents.filter((i: Incident) => i.ehsCategory === 'UNSAFE_BEHAVIOR').length;
    const nearMisses = incidents.filter((i: Incident) => i.ehsCategory === 'NEAR_MISS').length;
    const firstAids = incidents.filter((i: Incident) => i.ehsCategory === 'FIRST_AID').length;
    const recordables = incidents.filter((i: Incident) => i.ehsCategory === 'RECORDABLE').length;
    const ltis = incidents.filter((i: Incident) => i.ehsCategory === 'LTI').length;
    const fatalities = incidents.filter((i: Incident) => i.ehsCategory === 'FATALITY').length;
    const propertyDamages = incidents.filter((i: Incident) => i.ehsCategory === 'PROPERTY_DAMAGE').length;
    const environmentIncidents = incidents.filter((i: Incident) => i.ehsCategory === 'ENVIRONMENT').length;
    const safetyObservations = incidents.filter((i: Incident) => i.ehsCategory === 'SAFETY_OBSERVATION').length;

    // Get existing monthly data
    const existingData = await prisma.eHSMonthlyData.findFirst({
      where: {
        year: parseInt(year),
        month: parseInt(month),
        projectId: projectId || null,
      },
    });

    const totalHours = existingData?.totalHours || 0;
    const ltifr = totalHours > 0 ? (ltis / totalHours) * 1000000 : null;
    const trir = totalHours > 0 ? (recordables / totalHours) * 200000 : null;

    // Count closed incidents for closing rate
    const closedIncidents = incidents.filter((i: Incident) => i.status === 'CLOSED' || i.status === 'RESOLVED').length;
    const closingRate = incidents.length > 0 ? (closedIncidents / incidents.length) * 100 : null;

    // Update monthly data
    const monthlyData = await prisma.eHSMonthlyData.upsert({
      where: {
        year_month_projectId: {
          year: parseInt(year),
          month: parseInt(month),
          projectId: projectId || null,
        },
      },
      update: {
        unsafeConditions,
        unsafeBehaviors,
        nearMisses,
        firstAids,
        recordables,
        ltis,
        fatalities,
        propertyDamages,
        environmentIncidents,
        safetyObservations,
        ltifr,
        trir,
        closingRate,
      },
      create: {
        year: parseInt(year),
        month: parseInt(month),
        projectId,
        unsafeConditions,
        unsafeBehaviors,
        nearMisses,
        firstAids,
        recordables,
        ltis,
        fatalities,
        propertyDamages,
        environmentIncidents,
        safetyObservations,
        ltifr,
        trir,
        closingRate,
        workingDays: existingData?.workingDays || 0,
        workersPerDay: existingData?.workersPerDay || 0,
        hoursPerDay: existingData?.hoursPerDay || 0,
        totalEmployees: existingData?.totalEmployees || 0,
        totalHours: existingData?.totalHours || 0,
      },
    });

    res.json({
      monthlyData,
      incidentCount: incidents.length,
      closedCount: closedIncidents,
    });
  } catch (error) {
    console.error('Error calculating monthly KPIs:', error);
    res.status(500).json({ error: 'Failed to calculate monthly KPIs' });
  }
};

// Generate EHS PDF Report
export const generateEHSPDFReport = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const yearInt = parseInt(year as string);
    const monthInt = parseInt(month as string);

    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    const pdfBuffer = await generateEHSReport(yearInt, monthInt);

    const filename = `EHS_Bericht_${monthNames[monthInt - 1]}_${yearInt}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate EHS PDF report error:', error);
    res.status(500).json({ error: 'Failed to generate EHS PDF report' });
  }
};
