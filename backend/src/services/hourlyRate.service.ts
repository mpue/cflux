import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Ermittelt den Stundensatz für einen User in einem Projekt.
 * 
 * Hierarchie (von spezifisch zu allgemein):
 * 1. Zeitmodell-Stundensatz (falls Zeitmodell für User aktiv und timestamp angegeben)
 * 2. User.hourlyRate (user-spezifischer Stundensatz)
 * 3. Project.defaultHourlyRate (projekt-spezifischer Default)
 * 4. SystemSettings.defaultHourlyRate (globaler Fallback)
 * 
 * @param userId - User ID
 * @param projectId - Projekt ID (optional)
 * @param timestamp - Zeitpunkt für Zeitmodell-Berechnung (optional, default: jetzt)
 * @returns Stundensatz in CHF
 * @throws Error wenn kein Stundensatz ermittelt werden kann
 */
export async function getHourlyRateForUser(
  userId: string,
  projectId?: string,
  timestamp?: Date
): Promise<number> {
  // 1. Prüfe Zeitmodell (falls timestamp angegeben)
  if (timestamp) {
    try {
      // Dynamischer Import um zirkuläre Abhängigkeiten zu vermeiden
      const { ZeitmodellService } = await import('./zeitmodell.service');
      const zeitmodellService = new ZeitmodellService();
      
      // Prüfe ob aktives Zeitmodell existiert
      const datum = new Date(timestamp);
      const uhrzeit = datum.toTimeString().split(' ')[0]; // "HH:MM:SS"
      
      const result = await zeitmodellService.getStundensatz(userId, datum, uhrzeit);
      
      console.log(`[HOURLY_RATE] Zeitmodell-Stundensatz verwendet: ${result.stundensatz} CHF/h (${result.zeitmodellName})`);
      return result.stundensatz;
    } catch (error) {
      // Kein Zeitmodell gefunden oder Fehler → Fallback auf Standard-System
      console.log(`[HOURLY_RATE] Kein Zeitmodell verfügbar, verwende Standard-System: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 2. Prüfe User-spezifischen Stundensatz
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      employeeProfile: {
        select: {
          hourlyRate: true
        }
      }
    },
  });

  const hourlyRate = user?.employeeProfile?.hourlyRate;
  if (hourlyRate && hourlyRate > 0) {
    console.log(`[HOURLY_RATE] User-Stundensatz verwendet: ${hourlyRate} CHF/h`);
    return hourlyRate;
  }

  // 3. Prüfe Projekt-Default (falls Projekt angegeben)
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { defaultHourlyRate: true },
    });

    if (project?.defaultHourlyRate && project.defaultHourlyRate > 0) {
      console.log(`[HOURLY_RATE] Projekt-Stundensatz verwendet: ${project.defaultHourlyRate} CHF/h`);
      return project.defaultHourlyRate;
    }
  }

  // 4. Prüfe System-Default
  const systemSettings = await prisma.systemSettings.findFirst({
    select: { defaultHourlyRate: true },
  });

  if (systemSettings?.defaultHourlyRate && systemSettings.defaultHourlyRate > 0) {
    console.log(`[HOURLY_RATE] System-Default-Stundensatz verwendet: ${systemSettings.defaultHourlyRate} CHF/h`);
    return systemSettings.defaultHourlyRate;
  }

  // Kein Stundensatz gefunden - das sollte nicht passieren
  throw new Error(
    `Kein Stundensatz definiert für User ${userId}. ` +
    `Bitte Stundensatz in User-Profil, Projekt oder System-Einstellungen hinterlegen.`
  );
}
