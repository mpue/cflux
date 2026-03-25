import { prisma } from '../lib/prisma';
import { getHourlyRateForUser } from './hourlyRate.service';


/**
 * Aktualisiert das Projekt-Budget basierend auf einem TimeEntry.
 * Wird nach Clock-Out automatisch aufgerufen.
 * 
 * Logik:
 * 1. Prüft ob ProjectTimeAllocations vorhanden sind
 *    → JA: Budget auf ALLE zugewiesenen Projekte verteilen
 *    → NEIN: Ganzes Budget auf TimeEntry.projectId
 * 2. Ermittelt den Stundensatz (Zeitmodell → User → Projekt → System)
 * 3. Sucht oder erstellt eine LABOR Budget-Position für den User
 * 4. Aktualisiert actualHours und actualCost
 * 5. Berechnet das Budget neu (variance, etc.)
 * 
 * @param timeEntryId - ID des TimeEntry
 */
export async function updateBudgetFromTimeEntry(timeEntryId: string): Promise<void> {
  // 1. TimeEntry laden (inkl. Allokationen)
  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userId: true
        },
      },
      projectTimeAllocations: {
        select: {
          projectId: true,
          hours: true,
        },
      },
    },
  });

  if (!timeEntry) {
    console.warn(`TimeEntry ${timeEntryId} nicht gefunden`);
    return;
  }

  // Nur verarbeiten wenn Status CLOCKED_OUT
  if (timeEntry.status !== 'CLOCKED_OUT') {
    return;
  }

  // Nur verarbeiten wenn clockIn und clockOut vorhanden
  if (!timeEntry.clockIn || !timeEntry.clockOut) {
    return;
  }

  // 2. Stundensatz ermitteln (mit Zeitmodell-Support)
  let hourlyRate: number;
  try {
    const userId = timeEntry.employee.userId;
    if (!userId) {
      console.warn(`Employee ${timeEntry.employeeId} has no userId`);
      return;
    }
    hourlyRate = await getHourlyRateForUser(
      userId, 
      timeEntry.projectId || undefined,
      timeEntry.clockOut
    );
  } catch (error) {
    console.error(`Fehler beim Ermitteln des Stundensatzes: ${error}`);
    return;
  }

  const itemName = `${timeEntry.employee.firstName} ${timeEntry.employee.lastName}`;

  // 3. Prüfe ob ProjectTimeAllocations vorhanden sind
  if (timeEntry.projectTimeAllocations && timeEntry.projectTimeAllocations.length > 0) {
    // Verteilung auf ALLE zugewiesenen Projekte
    console.log(`[BUDGET] Verteilung auf ${timeEntry.projectTimeAllocations.length} Projekte via ProjectTimeAllocation`);
    for (const allocation of timeEntry.projectTimeAllocations) {
      await updateProjectBudget(allocation.projectId, allocation.hours, hourlyRate, itemName);
    }
  } else if (timeEntry.projectId) {
    // Fallback: Ganzes Budget auf direktes Projekt
    const startTime = new Date(timeEntry.clockIn).getTime();
    const endTime = new Date(timeEntry.clockOut).getTime();
    const pauseMinutes = timeEntry.pauseMinutes || 0;
    const totalPauseMs = pauseMinutes * 60 * 1000;
    const workedMs = endTime - startTime - totalPauseMs;
    const workedHours = workedMs / (1000 * 60 * 60);

    if (workedHours <= 0) {
      return;
    }

    await updateProjectBudget(timeEntry.projectId, workedHours, hourlyRate, itemName);
  } else {
    // Kein Projekt zugeordnet → nichts zu tun
    return;
  }
}

/**
 * Aktualisiert das Budget eines einzelnen Projekts.
 */
async function updateProjectBudget(
  projectId: string, 
  workedHours: number, 
  hourlyRate: number, 
  itemName: string
): Promise<void> {
  // Aktives Budget für das Projekt suchen
  const budget = await prisma.projectBudget.findFirst({
    where: {
      projectId,
      isActive: true,
      status: {
        in: ['PLANNING', 'ACTIVE'],
      },
    },
    select: {
      id: true,
    },
  });

  if (!budget) {
    return; // Kein aktives Budget → nichts zu tun
  }

  // Budget-Position für Employee finden oder erstellen
  let budgetItem = await prisma.projectBudgetItem.findFirst({
    where: {
      budgetId: budget.id,
      category: 'LABOR',
      itemName: itemName,
    },
  });

  if (!budgetItem) {
    budgetItem = await prisma.projectBudgetItem.create({
      data: {
        budgetId: budget.id,
        category: 'LABOR',
        itemName: itemName,
        description: `Zeiterfassung ${itemName}`,
        plannedQuantity: 0,
        plannedHours: 0,
        actualQuantity: 0,
        actualHours: 0,
        unitPrice: 0,
        hourlyRate: hourlyRate,
        plannedCost: 0,
        actualCost: 0,
      },
    });
  }

  // Budget-Position aktualisieren
  const newActualHours = (budgetItem.actualHours || 0) + workedHours;
  const newActualCost = newActualHours * hourlyRate;
  const plannedCost = (budgetItem.plannedHours || 0) * hourlyRate;
  const variance = newActualCost - plannedCost;
  const variancePercent = plannedCost > 0 ? (variance / plannedCost) * 100 : 0;

  await prisma.projectBudgetItem.update({
    where: { id: budgetItem.id },
    data: {
      actualHours: newActualHours,
      actualCost: newActualCost,
      hourlyRate: hourlyRate,
      variance: variance,
      variancePercent: variancePercent,
    },
  });

  // Budget neu berechnen
  await recalculateBudget(budget.id);

  console.log(
    `Budget aktualisiert: ${workedHours.toFixed(2)}h für ${itemName} ` +
    `auf Projekt ${projectId} (${hourlyRate} CHF/h = ${(workedHours * hourlyRate).toFixed(2)} CHF)`
  );
}

/**
 * Berechnet die Summen eines Projekt-Budgets neu.
 */
async function recalculateBudget(budgetId: string): Promise<void> {
  const items = await prisma.projectBudgetItem.findMany({
    where: {
      budgetId: budgetId,
      isActive: true,
    },
  });

  let totalPlanned = 0;
  let totalActual = 0;

  for (const item of items) {
    totalPlanned += item.plannedCost || 0;
    totalActual += item.actualCost || 0;
  }

  const variance = totalActual - totalPlanned;
  const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;
  
  // Budget holen um totalBudget zu verwenden
  const budget = await prisma.projectBudget.findUnique({
    where: { id: budgetId },
    select: { totalBudget: true },
  });
  
  if (!budget) return;
  
  const utilization = budget.totalBudget > 0 ? (totalActual / budget.totalBudget) * 100 : 0;

  // Budget-Status ermitteln basierend auf totalBudget
  let status: string = 'PLANNING';
  if (totalActual > 0) {
    status = 'ACTIVE';
  }
  if (utilization >= 100) {
    status = 'EXCEEDED';
  }

  await prisma.projectBudget.update({
    where: { id: budgetId },
    data: {
      plannedCosts: totalPlanned,
      actualCosts: totalActual,
      remainingBudget: budget.totalBudget - totalActual,
      budgetUtilization: utilization,
      status: status as any,
    },
  });
}

/**
 * Macht ein Budget-Update für einen TimeEntry rückgängig.
 * Wird beim Löschen eines TimeEntry aufgerufen.
 * 
 * Logik:
 * 1. TimeEntry laden inkl. Allokationen
 * 2. Stundensatz ermitteln
 * 3. actualHours und actualCost vom BudgetItem abziehen
 * 4. Budget neu berechnen
 */
export async function reverseBudgetFromTimeEntry(timeEntryId: string): Promise<void> {
  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userId: true
        },
      },
      projectTimeAllocations: {
        select: {
          projectId: true,
          hours: true,
        },
      },
    },
  });

  if (!timeEntry || !timeEntry.clockIn || !timeEntry.clockOut) {
    return;
  }

  // Stundensatz ermitteln
  let hourlyRate: number;
  try {
    const userId = timeEntry.employee.userId;
    if (!userId) return;
    hourlyRate = await getHourlyRateForUser(
      userId,
      timeEntry.projectId || undefined,
      timeEntry.clockOut
    );
  } catch (error) {
    console.error(`Fehler beim Ermitteln des Stundensatzes für Reversal: ${error}`);
    return;
  }

  const itemName = `${timeEntry.employee.firstName} ${timeEntry.employee.lastName}`;

  if (timeEntry.projectTimeAllocations && timeEntry.projectTimeAllocations.length > 0) {
    for (const allocation of timeEntry.projectTimeAllocations) {
      await reverseProjectBudget(allocation.projectId, allocation.hours, hourlyRate, itemName);
    }
  } else if (timeEntry.projectId) {
    const startTime = new Date(timeEntry.clockIn).getTime();
    const endTime = new Date(timeEntry.clockOut).getTime();
    const pauseMinutes = timeEntry.pauseMinutes || 0;
    const totalPauseMs = pauseMinutes * 60 * 1000;
    const workedMs = endTime - startTime - totalPauseMs;
    const workedHours = workedMs / (1000 * 60 * 60);

    if (workedHours <= 0) return;

    await reverseProjectBudget(timeEntry.projectId, workedHours, hourlyRate, itemName);
  }
}

/**
 * Zieht Stunden und Kosten von einem Projekt-Budget ab.
 */
async function reverseProjectBudget(
  projectId: string,
  workedHours: number,
  hourlyRate: number,
  itemName: string
): Promise<void> {
  const budget = await prisma.projectBudget.findFirst({
    where: {
      projectId,
      isActive: true,
      status: { in: ['PLANNING', 'ACTIVE', 'EXCEEDED'] },
    },
    select: { id: true },
  });

  if (!budget) return;

  const budgetItem = await prisma.projectBudgetItem.findFirst({
    where: {
      budgetId: budget.id,
      category: 'LABOR',
      itemName: itemName,
    },
  });

  if (!budgetItem) return;

  const newActualHours = Math.max(0, (budgetItem.actualHours || 0) - workedHours);
  const newActualCost = newActualHours * hourlyRate;
  const plannedCost = (budgetItem.plannedHours || 0) * hourlyRate;
  const variance = newActualCost - plannedCost;
  const variancePercent = plannedCost > 0 ? (variance / plannedCost) * 100 : 0;

  await prisma.projectBudgetItem.update({
    where: { id: budgetItem.id },
    data: {
      actualHours: newActualHours,
      actualCost: newActualCost,
      variance: variance,
      variancePercent: variancePercent,
    },
  });

  await recalculateBudget(budget.id);

  console.log(
    `[BUDGET REVERSAL] ${workedHours.toFixed(2)}h für ${itemName} ` +
    `von Projekt ${projectId} abgezogen (${hourlyRate} CHF/h = ${(workedHours * hourlyRate).toFixed(2)} CHF)`
  );
}
