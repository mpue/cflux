import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth';

/**
 * Projektbezogene Zugriffskontrolle.
 *
 * Regel: Ein Benutzer darf nur auf Daten eines Projekts zugreifen, wenn ihm das
 * Projekt ueber eine ProjectAssignment zugeordnet ist. Admins sehen wie ueberall
 * im System alle Projekte.
 *
 * Diese Pruefung ist unabhaengig von der Modulberechtigung (requireModuleAccess):
 * Modulrecht regelt "darf der Benutzer Berichte ueberhaupt sehen/anlegen",
 * die Projektzuordnung regelt "welche Berichte".
 */

/** Prueft, ob der Benutzer dem Projekt zugeordnet ist. */
export const hasProjectAccess = async (
  user: { id: string; role: UserRole },
  projectId: string
): Promise<boolean> => {
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  const assignment = await prisma.projectAssignment.findFirst({
    where: { userId: user.id, projectId },
    select: { id: true },
  });

  return assignment !== null;
};

/**
 * Liefert die IDs aller Projekte, auf die der Benutzer zugreifen darf.
 * `null` bedeutet "keine Einschraenkung" (Admin).
 */
export const getAccessibleProjectIds = async (
  user: { id: string; role: UserRole }
): Promise<string[] | null> => {
  if (user.role === UserRole.ADMIN) {
    return null;
  }

  const assignments = await prisma.projectAssignment.findMany({
    where: { userId: user.id },
    select: { projectId: true },
  });

  return assignments.map((a) => a.projectId);
};

/**
 * Middleware fuer Routen, die eine Projekt-ID in den Parametern oder im Body
 * tragen. Ohne Zuordnung: 403.
 */
export const requireProjectAccess = (source: 'params' | 'body' = 'params', key = 'projectId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const projectId = (source === 'params' ? req.params : req.body)?.[key];

      if (!projectId) {
        return res.status(400).json({ error: 'projectId ist erforderlich' });
      }

      if (!(await hasProjectAccess(req.user, projectId))) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Sie sind diesem Projekt nicht zugeordnet',
        });
      }

      next();
    } catch (error) {
      console.error('Error checking project access:', error);
      return res.status(500).json({ error: 'Failed to check project access' });
    }
  };
};
