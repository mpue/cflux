import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const createBackup = async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Export all data using Prisma
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        vacationDays: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const projects = await prisma.project.findMany();
    const timeEntries = await prisma.timeEntry.findMany();
    const absenceRequests = await prisma.absenceRequest.findMany();
    const projectAssignments = await prisma.projectAssignment.findMany();

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        projects,
        timeEntries,
        absenceRequests,
        projectAssignments
      }
    };

    // Write backup to file
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

    res.json({
      message: 'Backup created successfully',
      filename,
      timestamp: new Date().toISOString(),
      size: fs.statSync(filepath).size
    });
  } catch (error: any) {
    console.error('Backup creation error:', error);
    res.status(500).json({ error: 'Failed to create backup', details: error.message });
  }
};

export const listBackups = async (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.json') || file.endsWith('.sql'))
      .map(file => {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());

    res.json(files);
  } catch (error: any) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Failed to list backups', details: error.message });
  }
};

export const downloadBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    res.download(filepath, filename);
  } catch (error: any) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: 'Failed to download backup', details: error.message });
  }
};

export const deleteBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    fs.unlinkSync(filepath);

    res.json({ message: 'Backup deleted successfully' });
  } catch (error: any) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: 'Failed to delete backup', details: error.message });
  }
};

export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Read and parse backup file
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    // Delete all existing data (in reverse order of dependencies)
    await prisma.timeEntry.deleteMany();
    await prisma.absenceRequest.deleteMany();
    await prisma.projectAssignment.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    // Restore data from backup
    if (backupData.data.users) {
      for (const user of backupData.data.users) {
        await prisma.user.create({ data: user });
      }
    }

    if (backupData.data.projects) {
      for (const project of backupData.data.projects) {
        await prisma.project.create({ data: project });
      }
    }

    if (backupData.data.projectAssignments) {
      for (const assignment of backupData.data.projectAssignments) {
        await prisma.projectAssignment.create({ data: assignment });
      }
    }

    if (backupData.data.timeEntries) {
      for (const entry of backupData.data.timeEntries) {
        await prisma.timeEntry.create({ data: entry });
      }
    }

    if (backupData.data.absenceRequests) {
      for (const absence of backupData.data.absenceRequests) {
        await prisma.absenceRequest.create({ data: absence });
      }
    }

    res.json({ message: 'Backup restored successfully' });
  } catch (error: any) {
    console.error('Restore backup error:', error);
    res.status(500).json({ error: 'Failed to restore backup', details: error.message });
  }
};

export const uploadBackup = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = req.file.originalname.endsWith('.json') ? 'json' : 'sql';
    const filename = `uploaded_backup_${timestamp}.${extension}`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Move uploaded file to backup directory
    fs.renameSync(req.file.path, filepath);

    res.json({
      message: 'Backup uploaded successfully',
      filename,
      timestamp: new Date().toISOString(),
      size: fs.statSync(filepath).size
    });
  } catch (error: any) {
    console.error('Upload backup error:', error);
    res.status(500).json({ error: 'Failed to upload backup', details: error.message });
  }
};

export const exportData = async (req: Request, res: Response) => {
  try {
    // Export all data as JSON
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        vacationDays: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const projects = await prisma.project.findMany();
    const timeEntries = await prisma.timeEntry.findMany();
    const absenceRequests = await prisma.absenceRequest.findMany();
    const projectAssignments = await prisma.projectAssignment.findMany();

    const data = {
      exportDate: new Date().toISOString(),
      users,
      projects,
      timeEntries,
      absenceRequests,
      projectAssignments
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="data_export_${new Date().toISOString()}.json"`);
    res.json(data);
  } catch (error: any) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data', details: error.message });
  }
};
