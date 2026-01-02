import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';
import path from 'path';
import { marked } from 'marked';

const prisma = new PrismaClient();

// Format filename to title
function formatTitle(filename: string): string {
  // Remove .md extension
  const nameWithoutExt = filename.replace(/\.md$/i, '');
  
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
    if (!entry.isDirectory && entry.name.toLowerCase().endsWith('.md')) {
      const markdownContent = entry.getData().toString('utf8');
      const title = formatTitle(entry.name);
      
      // Convert Markdown to HTML for TipTap editor
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
    }
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
