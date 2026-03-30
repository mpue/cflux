import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import { canConvertToPdf, isPdf, generatePdfPreview } from '../services/gotenberg.service';


// Supported file extensions for import (Gotenberg + PDF)
function isSupportedFile(filename: string): boolean {
  return canConvertToPdf(filename) || isPdf(filename);
}

// Format filename to title
function formatTitle(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/i, '');
  
  // Check if filename contains underscore
  if (nameWithoutExt.includes('_')) {
    // Split by underscore and format each part
    return nameWithoutExt
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  } else {
    // Just capitalize first letter
    return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1).toLowerCase();
  }
}

// Save a file buffer to the attachments directory and return the stored filename
function saveAttachmentFile(originalFilename: string, data: Buffer): { filename: string; filePath: string } {
  const uploadDir = path.join(__dirname, '../../uploads/attachments');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const ext = path.extname(originalFilename);
  const filename = `${uuidv4()}${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, data);
  return { filename, filePath };
}

// Detect MIME type from extension
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    '.odg': 'application/vnd.oasis.opendocument.graphics',
    '.rtf': 'application/rtf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.tiff': 'image/tiff',
    '.webp': 'image/webp',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// Recursive function to process zip entries
async function processZipEntries(
  zip: AdmZip,
  parentNodeId: string,
  basePath: string,
  userId: string
): Promise<void> {
  const entries = zip.getEntries();
  
  // Group entries by directory
  const dirMap = new Map<string, AdmZip.IZipEntry[]>();
  
  for (const entry of entries) {
    if (entry.entryName.startsWith(basePath)) {
      const relativePath = entry.entryName.substring(basePath.length);
      if (!relativePath) continue;
      
      const parts = relativePath.split('/').filter(p => p);
      if (parts.length === 0) continue;
      
      const currentDir = parts.length > 1 ? parts[0] : '';
      
      if (!dirMap.has(currentDir)) {
        dirMap.set(currentDir, []);
      }
      dirMap.get(currentDir)!.push(entry);
    }
  }
  
  // Process files in current directory (no subdirectory)
  const currentDirEntries = dirMap.get('') || [];
  for (const entry of currentDirEntries) {
    if (entry.isDirectory) continue;
    
    const filename = entry.name;
    
    if (filename.toLowerCase().endsWith('.md')) {
      // Markdown files: convert to HTML content as before
      const markdownContent = entry.getData().toString('utf8');
      const title = formatTitle(filename);
      const htmlContent = await marked(markdownContent);
      
      await prisma.documentNode.create({
        data: {
          title,
          type: 'DOCUMENT',
          contentType: 'MARKDOWN',
          content: htmlContent,
          parentId: parentNodeId,
          createdById: userId,
          updatedById: userId,
        },
      });
    } else if (isSupportedFile(filename)) {
      // Gotenberg-supported files: create document node + attachment
      const title = formatTitle(filename);
      const fileData = entry.getData();
      const mimeType = getMimeType(filename);
      
      // Create the document node
      const docNode = await prisma.documentNode.create({
        data: {
          title,
          type: 'DOCUMENT',
          contentType: 'ATTACHMENT',
          content: '',
          parentId: parentNodeId,
          createdById: userId,
          updatedById: userId,
        },
      });
      
      // Save file to disk
      const { filename: storedFilename, filePath: storedFilePath } = saveAttachmentFile(filename, fileData);
      
      // Generate PDF preview via Gotenberg
      let pdfPath: string | null = null;
      try {
        pdfPath = await generatePdfPreview(storedFilePath, filename, storedFilename);
      } catch (err) {
        console.warn(`PDF preview generation failed for ${filename}:`, err);
      }
      
      // Create attachment record
      const attachment = await prisma.documentNodeAttachment.create({
        data: {
          documentNodeId: docNode.id,
          filename: storedFilename,
          originalFilename: filename,
          mimeType,
          fileSize: fileData.length,
          path: `/uploads/attachments/${storedFilename}`,
          pdfPath,
          description: `Importiert aus ZIP-Archiv`,
          version: 1,
          createdById: userId,
          updatedById: userId,
        },
      });
      
      // Create initial version record
      await prisma.documentNodeAttachmentVersion.create({
        data: {
          attachmentId: attachment.id,
          filename: storedFilename,
          originalFilename: filename,
          mimeType,
          fileSize: fileData.length,
          path: `/uploads/attachments/${storedFilename}`,
          version: 1,
          changeReason: 'Importiert aus ZIP-Archiv',
          createdById: userId,
        },
      });
    }
    // Unsupported files are silently skipped
  }
  
  // Process subdirectories
  const subdirs = Array.from(dirMap.keys()).filter(k => k !== '');
  for (const subdir of subdirs) {
    // Create folder node
    const folderTitle = subdir.charAt(0).toUpperCase() + subdir.slice(1).toLowerCase();
    const folderNode = await prisma.documentNode.create({
      data: {
        title: folderTitle,
        type: 'FOLDER',
        contentType: 'CONTAINER',
        parentId: parentNodeId,
        createdById: userId,
        updatedById: userId,
      },
    });
    
    // Recursively process this subdirectory
    const newBasePath = basePath + subdir + '/';
    await processZipEntries(zip, folderNode.id, newBasePath, userId);
  }
}

export const importZip = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { parentId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }
    
    // Check if parent exists and user has permission
    if (parentId) {
      const parent = await prisma.documentNode.findUnique({
        where: { id: parentId },
      });
      
      if (!parent) {
        return res.status(404).json({ error: 'Übergeordneter Ordner nicht gefunden' });
      }
      
      if (parent.type !== 'FOLDER') {
        return res.status(400).json({ error: 'Übergeordneter Knoten muss ein Ordner sein' });
      }
    }
    
    // Extract zip filename without extension for root folder name
    const zipFilename = path.basename(req.file.originalname, '.zip');
    const rootFolderTitle = zipFilename.charAt(0).toUpperCase() + zipFilename.slice(1).toLowerCase();
    
    // Create root folder for this import
    const rootFolder = await prisma.documentNode.create({
      data: {
        title: rootFolderTitle,
        type: 'FOLDER',
        contentType: 'CONTAINER',
        parentId: parentId || null,
        createdById: userId,
        updatedById: userId,
      },
    });
    
    // Read and process zip file
    const zip = new AdmZip(req.file.buffer);
    
    // Start processing from root of zip
    await processZipEntries(zip, rootFolder.id, '', userId);
    
    res.json({
      message: 'Zip-Datei erfolgreich importiert',
      rootFolderId: rootFolder.id,
      rootFolderTitle,
    });
  } catch (error) {
    console.error('Zip import error:', error);
    res.status(500).json({ error: 'Fehler beim Importieren der Zip-Datei' });
  }
};

/**
 * Handle a single file drop onto a tree node.
 * - Markdown files: create a document node with converted HTML content.
 * - Supported formats: create a document node with the file as attachment + PDF preview.
 */
export const dropFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { parentId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    const originalFilename = req.file.originalname;
    const ext = path.extname(originalFilename).toLowerCase();

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.documentNode.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return res.status(404).json({ error: 'Übergeordneter Knoten nicht gefunden' });
      }
    }

    const title = formatTitle(originalFilename);

    if (ext === '.md') {
      // Markdown: read content, convert to HTML, create document
      const markdownContent = req.file.buffer.toString('utf8');
      const htmlContent = await marked(markdownContent);

      const docNode = await prisma.documentNode.create({
        data: {
          title,
          type: 'DOCUMENT',
          contentType: 'MARKDOWN',
          content: htmlContent,
          parentId: parentId || null,
          createdById: userId,
          updatedById: userId,
        },
      });

      return res.json({ message: 'Dokument erstellt', node: docNode });
    }

    if (isSupportedFile(originalFilename)) {
      // Supported format: create document + attachment
      const docNode = await prisma.documentNode.create({
        data: {
          title,
          type: 'DOCUMENT',
          contentType: 'ATTACHMENT',
          content: '',
          parentId: parentId || null,
          createdById: userId,
          updatedById: userId,
        },
      });

      const { filename: storedFilename, filePath: storedFilePath } = saveAttachmentFile(originalFilename, req.file.buffer);
      const mimeType = getMimeType(originalFilename);

      let pdfPath: string | null = null;
      try {
        pdfPath = await generatePdfPreview(storedFilePath, originalFilename, storedFilename);
      } catch (err) {
        console.warn(`PDF preview generation failed for ${originalFilename}:`, err);
      }

      const attachment = await prisma.documentNodeAttachment.create({
        data: {
          documentNodeId: docNode.id,
          filename: storedFilename,
          originalFilename,
          mimeType,
          fileSize: req.file.size,
          path: `/uploads/attachments/${storedFilename}`,
          pdfPath,
          description: `Per Drag & Drop importiert`,
          version: 1,
          createdById: userId,
          updatedById: userId,
        },
      });

      await prisma.documentNodeAttachmentVersion.create({
        data: {
          attachmentId: attachment.id,
          filename: storedFilename,
          originalFilename,
          mimeType,
          fileSize: req.file.size,
          path: `/uploads/attachments/${storedFilename}`,
          version: 1,
          changeReason: 'Per Drag & Drop importiert',
          createdById: userId,
        },
      });

      return res.json({ message: 'Dokument mit Anhang erstellt', node: docNode });
    }

    return res.status(400).json({
      error: `Dateityp "${ext}" wird nicht unterstützt. Erlaubt: Markdown (.md), PDF, Office-Dokumente, Bilder.`,
    });
  } catch (error) {
    console.error('Drop file error:', error);
    res.status(500).json({ error: 'Fehler beim Verarbeiten der Datei' });
  }
};
