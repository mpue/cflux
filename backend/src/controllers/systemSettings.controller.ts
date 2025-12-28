import { Request, Response } from 'express';
import { systemSettingsService } from '../services/systemSettings.service';

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
