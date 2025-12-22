import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images only
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nur Bilddateien (PNG, JPG, SVG) sind erlaubt'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Upload logo
export const uploadLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      url: logoUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen des Logos' });
  }
};

// Delete uploaded file
export const deleteUpload = async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Ungültiger Dateiname' });
    }

    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({ message: 'Datei erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Datei' });
  }
};
