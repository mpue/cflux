import { Request, Response } from 'express';
import { systemSettingsService } from '../services/systemSettings.service';
import { backupScheduler } from '../services/backupScheduler.service';
import { action1Scheduler } from '../services/action1Scheduler.service';
import { invalidateTimeRoundingCache } from '../utils/timeRounding';

export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = await systemSettingsService.getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await systemSettingsService.getPublicSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = await systemSettingsService.updateSettings(req.body);
    invalidateTimeRoundingCache();

    // Reschedule backup if backup-related settings changed
    if (
      req.body.autoBackupEnabled !== undefined ||
      req.body.backupInterval !== undefined ||
      req.body.backupTime !== undefined ||
      req.body.backupRetention !== undefined
    ) {
      backupScheduler.reschedule().catch(err => {
        console.error('Failed to reschedule backup:', err);
      });
    }

    // Reschedule Action1 auto-sync if related settings changed
    if (
      req.body.action1Enabled !== undefined ||
      req.body.action1AutoSync !== undefined ||
      req.body.action1SyncInterval !== undefined ||
      req.body.action1SyncTime !== undefined
    ) {
      action1Scheduler.reschedule().catch(err => {
        console.error('Failed to reschedule Action1 sync:', err);
      });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const testEmailSettings = async (req: Request, res: Response) => {
  try {
    const result = await systemSettingsService.testEmailSettings(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadCompanyLogo = async (req: Request, res: Response) => {
  try {
    const { logoData } = req.body;
    
    if (!logoData) {
      return res.status(400).json({ error: 'Logo-Daten fehlen' });
    }

    const settings = await systemSettingsService.uploadLogo(logoData);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
