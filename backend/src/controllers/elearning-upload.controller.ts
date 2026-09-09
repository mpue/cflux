import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configure upload directories
const uploadsBaseDir = path.join(__dirname, '../../uploads');
const thumbnailsDir = path.join(uploadsBaseDir, 'course-thumbnails');
const contentImagesDir = path.join(uploadsBaseDir, 'course-content');
const pdfFilesDir = path.join(uploadsBaseDir, 'course-pdfs');
const videoFilesDir = path.join(uploadsBaseDir, 'course-videos');

// Ensure directories exist
[thumbnailsDir, contentImagesDir, pdfFilesDir, videoFilesDir].forEach(dir => {
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

// Storage configuration for PDF files
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfFilesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `pdf-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Storage configuration for video files
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoFilesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `video-${uuidv4()}${ext}`;
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

// File filter for PDFs
const pdfFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nur PDF-Dateien sind erlaubt'));
  }
};

// File filter for videos. Browser-taugliche Container: MP4/WebM/Ogg spielen
// ueberall, MOV nur teilweise - wir lassen es zu, weisen aber im Editor darauf hin.
const videoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-m4v',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nur Videodateien (MP4, WebM, Ogg, MOV) sind erlaubt'));
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

export const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for PDF files
  },
});

export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max for lesson videos
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

// Upload PDF file for lesson content
export const uploadLessonPdf = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    // Return relative URL path
    const fileUrl = `/uploads/course-pdfs/${req.file.filename}`;

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen der PDF-Datei' });
  }
};

/**
 * Multer-Wrapper fuer Video-Uploads. Ohne ihn landen Groessen- und
 * Typfehler im globalen Error-Handler und der Nutzer sieht nach einem
 * minutenlangen Upload nur "Internal server error".
 */
export const handleVideoUpload = (req: AuthRequest, res: Response, next: NextFunction) => {
  uploadVideo.single('video')(req as any, res as any, (err: any) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Die Videodatei ist zu groß (max. 2 GB)' });
      }
      return res.status(400).json({ error: `Upload fehlgeschlagen: ${err.message}` });
    }

    return res.status(400).json({ error: err.message || 'Fehler beim Hochladen des Videos' });
  });
};

// Upload video file for lesson content
export const uploadLessonVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    // Return relative URL path
    const fileUrl = `/uploads/course-videos/${req.file.filename}`;

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen des Videos' });
  }
};

// Delete uploaded file (thumbnail or content image)
export const deleteElearningUpload = async (req: AuthRequest, res: Response) => {
  try {
    const { type, filename } = req.params;

    // Validate type
    if (!['thumbnail', 'content', 'pdf', 'video'].includes(type)) {
      return res.status(400).json({ error: 'Ungültiger Upload-Typ' });
    }

    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Ungültiger Dateiname' });
    }

    let dir: string;
    if (type === 'thumbnail') {
      dir = thumbnailsDir;
    } else if (type === 'pdf') {
      dir = pdfFilesDir;
    } else if (type === 'video') {
      dir = videoFilesDir;
    } else {
      dir = contentImagesDir;
    }
    
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
