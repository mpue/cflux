import { PrismaClient } from '@prisma/client';
import { getHourlyRateForUser } from './hourlyRate.service';

const prisma = new PrismaClient();

/**
 * Aktualisiert das Projekt-Budget basierend auf einem TimeEntry.
 * Wird nach Clock-Out automatisch aufgerufen.
 * 
 * Logik:
 * 1. Prüft ob das Projekt ein aktives Budget hat
 * 2. Ermittelt den Stundensatz (User → Projekt → System)
 * 3. Sucht oder erstellt eine LABOR Budget-Position für den User
 * 4. Aktualisiert actualHours und actualCost
 * 5. Berechnet das Budget neu (variance, etc.)
 * 
 * @param timeEntryId - ID des TimeEntry
 */
export async function updateBudgetFromTimeEntry(timeEntryId: string): Promise<void> {
  // 1. TimeEntry laden
  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!timeEntry) {
    console.warn(`TimeEntry ${timeEntryId} nicht gefunden`);
    return;
  }

  // Nur verarbeiten wenn Projekt vorhanden und Status CLOCKED_OUT
  if (!timeEntry.projectId || timeEntry.status !== 'CLOCKED_OUT') {
    return;
  }

  // Nur verarbeiten wenn clockIn und clockOut vorhanden
  if (!timeEntry.clockIn || !timeEntry.clockOut) {
    return;
  }

  // 2. Aktives Budget für das Projekt suchen
  const budget = await prisma.projectBudget.findFirst({
    where: {
      projectId: timeEntry.projectId,
      isActive: true,
      status: {
        in: ['PLANNING', 'ACTIVE'], // Nur aktive Budgets aktualisieren
      },
    },
    select: {
      id: true,
    },
  });

  if (!budget) {
    // Kein aktives Budget → nichts zu tun
    return;
  }

  // 3. Stundensatz ermitteln
  let hourlyRate: number;
  try {
    hourlyRate = await getHourlyRateForUser(timeEntry.userId, timeEntry.projectId);
  } catch (error) {
    console.error(`Fehler beim Ermitteln des Stundensatzes: ${error}`);
    return; // Ohne Stundensatz können wir nicht weitermachen
  }

  // 4. Gebuchte Stunden berechnen
  const startTime = new Date(timeEntry.clockIn).getTime();
  const endTime = new Date(timeEntry.clockOut).getTime();
  const pauseMinutes = timeEntry.pauseMinutes || 0;
  const totalPauseMs = pauseMinutes * 60 * 1000; // Minuten in Millisekunden

  const workedMs = endTime - startTime - totalPauseMs;
  const workedHours = workedMs / (1000 * 60 * 60); // In Stunden umrechnen

  if (workedHours <= 0) {
    return; // Keine Stunden gebucht
  }

  // 5. Budget-Position für User finden oder erstellen
  const itemName = `${timeEntry.user.firstName} ${timeEntry.user.lastName}`;
  
  let budgetItem = await prisma.projectBudgetItem.findFirst({
    where: {
      budgetId: budget.id,
      category: 'LABOR',
      itemName: itemName,
    },
  });

  if (!budgetItem) {
    // Neue Budget-Position erstellen
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

  // 6. Budget-Position aktualisieren (actualHours und actualCost hinzufügen)
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
      hourlyRate: hourlyRate, // Update falls sich der Stundensatz geändert hat
      variance: variance,
      variancePercent: variancePercent,
    },
  });

  // 7. Budget neu berechnen (Summen aktualisieren)
  await recalculateBudget(budget.id);

  console.log(
    `Budget aktualisiert: ${workedHours.toFixed(2)}h für ${itemName} ` +
    `(${hourlyRate} CHF/h = ${(workedHours * hourlyRate).toFixed(2)} CHF)`
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
