import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { moduleService } from '../services/module.service';

export const createModule = async (req: AuthRequest, res: Response) => {
  try {
    const module = await moduleService.createModule(req.body);
    res.status(201).json(module);
  } catch (error: any) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: error.message || 'Failed to create module' });
  }
};

export const getAllModules = async (req: AuthRequest, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const modules = await moduleService.getAllModules(includeInactive);
    res.json(modules);
  } catch (error: any) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch modules' });
  }
};

export const getModuleById = async (req: AuthRequest, res: Response) => {
  try {
    const module = await moduleService.getModuleById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error: any) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch module' });
  }
};

export const updateModule = async (req: AuthRequest, res: Response) => {
  try {
    const module = await moduleService.updateModule(req.params.id, req.body);
    res.json(module);
  } catch (error: any) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: error.message || 'Failed to update module' });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response) => {
  try {
    await moduleService.deleteModule(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: error.message || 'Failed to delete module' });
  }
};

export const getModulesForUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.params.userId;
    const modules = await moduleService.getModulesForUser(userId);
    res.json(modules);
  } catch (error: any) {
    console.error('Error fetching user modules:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user modules' });
  }
};

export const grantModuleAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { userGroupId, permissions } = req.body;
    const access = await moduleService.grantModuleAccess(
      req.params.moduleId,
      userGroupId,
      permissions
    );
    res.status(201).json(access);
  } catch (error: any) {
    console.error('Error granting module access:', error);
    res.status(500).json({ error: error.message || 'Failed to grant module access' });
  }
};

export const updateModuleAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body;
    const access = await moduleService.updateModuleAccess(
      req.params.accessId,
      permissions
    );
    res.json(access);
  } catch (error: any) {
    console.error('Error updating module access:', error);
    res.status(500).json({ error: error.message || 'Failed to update module access' });
  }
};

export const revokeModuleAccess = async (req: AuthRequest, res: Response) => {
  try {
    await moduleService.revokeModuleAccess(req.params.accessId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error revoking module access:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke module access' });
  }
};

export const getModuleAccessByGroup = async (req: AuthRequest, res: Response) => {
  try {
    const access = await moduleService.getModuleAccessByGroup(req.params.groupId);
    res.json(access);
  } catch (error: any) {
    console.error('Error fetching module access:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch module access' });
  }
};

export const getGroupsForModule = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await moduleService.getGroupsForModule(req.params.moduleId);
    res.json(groups);
  } catch (error: any) {
    console.error('Error fetching groups for module:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch groups for module' });
  }
};
