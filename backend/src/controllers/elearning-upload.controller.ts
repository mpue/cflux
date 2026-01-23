import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configure upload directories
const uploadsBaseDir = path.join(__dirname, '../../uploads');
const thumbnailsDir = path.join(uploadsBaseDir, 'course-thumbnails');
const contentImagesDir = path.join(uploadsBaseDir, 'course-content');

// Ensure directories exist
[thumbnailsDir, contentImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for course thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `thumbnail-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Storage configuration for content images
const contentImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, contentImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `content-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter for images
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nur Bilddateien (PNG, JPG, GIF, WebP, SVG) sind erlaubt'));
  }
};

// Multer instances
export const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export const uploadContentImage = multer({
  storage: contentImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for content images
  },
});

// Upload course thumbnail
export const uploadCourseThumbnail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    // Return relative URL path
    const fileUrl = `/uploads/course-thumbnails/${req.file.filename}`;

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen des Thumbnails' });
  }
};

// Upload content image for lesson editor
export const uploadLessonContentImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    // Return relative URL path
    const fileUrl = `/uploads/course-content/${req.file.filename}`;

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading content image:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen des Bildes' });
  }
};

// Delete uploaded file (thumbnail or content image)
export const deleteElearningUpload = async (req: AuthRequest, res: Response) => {
  try {
    const { type, filename } = req.params;

    // Validate type
    if (!['thumbnail', 'content'].includes(type)) {
      return res.status(400).json({ error: 'Ungültiger Upload-Typ' });
    }

    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Ungültiger Dateiname' });
    }

    const dir = type === 'thumbnail' ? thumbnailsDir : contentImagesDir;
    const filePath = path.join(dir, filename);

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
