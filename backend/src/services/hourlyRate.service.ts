import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Ermittelt den Stundensatz für einen User in einem Projekt.
 * 
 * Hierarchie (von spezifisch zu allgemein):
 * 1. User.hourlyRate (user-spezifischer Stundensatz)
 * 2. Project.defaultHourlyRate (projekt-spezifischer Default)
 * 3. SystemSettings.defaultHourlyRate (globaler Fallback)
 * 
 * @param userId - User ID
 * @param projectId - Projekt ID
 * @returns Stundensatz in CHF
 * @throws Error wenn kein Stundensatz ermittelt werden kann
 */
export async function getHourlyRateForUser(
  userId: string,
  projectId?: string
): Promise<number> {
  // 1. Prüfe User-spezifischen Stundensatz
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hourlyRate: true },
  });

  if (user?.hourlyRate && user.hourlyRate > 0) {
    return user.hourlyRate;
  }

  // 2. Prüfe Projekt-Default (falls Projekt angegeben)
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { defaultHourlyRate: true },
    });

    if (project?.defaultHourlyRate && project.defaultHourlyRate > 0) {
      return project.defaultHourlyRate;
    }
  }

  // 3. Prüfe System-Default
  const systemSettings = await prisma.systemSettings.findFirst({
    select: { defaultHourlyRate: true },
  });

  if (systemSettings?.defaultHourlyRate && systemSettings.defaultHourlyRate > 0) {
    return systemSettings.defaultHourlyRate;
  }

  // Kein Stundensatz gefunden - das sollte nicht passieren
  throw new Error(
    `Kein Stundensatz definiert für User ${userId}. ` +
    `Bitte Stundensatz in User-Profil, Projekt oder System-Einstellungen hinterlegen.`
  );
}
