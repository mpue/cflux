import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import { moduleService } from '../services/module.service';
import { UserRole } from '@prisma/client';

/**
 * Middleware to check if user has access to a specific module
 * @param moduleKey - The key of the module to check access for (e.g., 'time_tracking', 'invoices')
 * @param permission - The required permission level ('canView', 'canCreate', 'canEdit', 'canDelete')
 */
export const requireModuleAccess = (
  moduleKey: string,
  permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' = 'canView'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Admins have access to all modules
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Check if user has the required module access
      const hasAccess = await moduleService.checkUserModuleAccess(
        req.user.id,
        moduleKey,
        permission
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `You don't have ${permission} permission for module: ${moduleKey}`
        });
      }

      next();
    } catch (error) {
      console.error('Error checking module access:', error);
      return res.status(500).json({ error: 'Failed to check module access' });
    }
  };
};

/**
 * Middleware to check if user can view a module
 */
export const canViewModule = (moduleKey: string) => {
  return requireModuleAccess(moduleKey, 'canView');
};

/**
 * Middleware to check if user can create in a module
 */
export const canCreateInModule = (moduleKey: string) => {
  return requireModuleAccess(moduleKey, 'canCreate');
};

/**
 * Middleware to check if user can edit in a module
 */
export const canEditInModule = (moduleKey: string) => {
  return requireModuleAccess(moduleKey, 'canEdit');
};

/**
 * Middleware to check if user can delete in a module
 */
export const canDeleteFromModule = (moduleKey: string) => {
  return requireModuleAccess(moduleKey, 'canDelete');
};
