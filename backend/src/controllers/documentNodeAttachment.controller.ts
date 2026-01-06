import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { checkModulePermission } from '../services/module.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Check if user has write access to a specific document node
 */
async function hasNodeWriteAccess(userId: string, nodeId: string): Promise<boolean> {
  // Get user's groups
  const userGroups = await prisma.userGroupMembership.findMany({
    where: {
      userId,
      userGroup: { isActive: true }
    },
    select: {
      userGroupId: true
    }
  });

  const userGroupIds = userGroups.map(ug => ug.userGroupId);

  // Get node permissions
  const nodePermissions = await prisma.documentNodeGroupPermission.findMany({
    where: { documentNodeId: nodeId }
  });

  // If no permissions are set, allow access
  if (nodePermissions.length === 0) {
    return true;
  }

  // Check if user's groups have WRITE or ADMIN permission
  const hasAccess = nodePermissions.some(
    (perm) => userGroupIds.includes(perm.userGroupId) && 
    (perm.permissionLevel === 'WRITE' || perm.permissionLevel === 'ADMIN')
  );

  return hasAccess;
}

/**
 * Get all attachments for a document node
 */
export const getNodeAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const { nodeId } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Check if node exists
    const node = await prisma.documentNode.findFirst({
      where: {
        id: nodeId,
        deletedAt: null
      }
    });

    if (!node) {
      return res.status(404).json({ error: 'Document node not found' });
    }

    // Get all active attachments
    const attachments = await prisma.documentNodeAttachment.findMany({
      where: {
        documentNodeId: nodeId,
        isActive: true,
        deletedAt: null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(attachments);
  } catch (error) {
    console.error('Get node attachments error:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
};

/**
 * Upload a new attachment to a document node
 */
export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { nodeId } = req.params;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to upload attachments' });
    }

    // Check node-specific write access
    const hasAccess = await hasNodeWriteAccess(userId, nodeId);
    if (!hasAccess) {
      // Delete uploaded file if no access
      fs.unlinkSync(file.path);
      return res.status(403).json({ error: 'No permission to modify this document' });
    }

    // Check if node exists
    const node = await prisma.documentNode.findFirst({
      where: {
        id: nodeId,
        deletedAt: null
      }
    });

    if (!node) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Document node not found' });
    }

    const { description } = req.body;

    // Create attachment record
    const attachment = await prisma.documentNodeAttachment.create({
      data: {
        documentNodeId: nodeId,
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        path: `uploads/attachments/${file.filename}`,
        description: description || null,
        version: 1,
        createdById: userId,
        updatedById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create initial version record
    await prisma.documentNodeAttachmentVersion.create({
      data: {
        attachmentId: attachment.id,
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        path: `uploads/attachments/${file.filename}`,
        version: 1,
        changeReason: 'Initial upload',
        createdById: userId
      }
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Upload attachment error:', error);
    // Clean up file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after upload error:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

/**
 * Update an existing attachment (creates new version)
 */
export const updateAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
    if (!hasWritePermission) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ error: 'No permission to update attachments' });
    }

    // Get existing attachment
    const existingAttachment = await prisma.documentNodeAttachment.findFirst({
      where: {
        id: attachmentId,
        isActive: true,
        deletedAt: null
      },
      include: {
        documentNode: true
      }
    });

    if (!existingAttachment) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check node-specific write access
    const hasAccess = await hasNodeWriteAccess(userId, existingAttachment.documentNodeId);
    if (!hasAccess) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ error: 'No permission to modify this document' });
    }

    const { description, changeReason } = req.body;
    const newVersion = existingAttachment.version + 1;

    // Delete old file (but keep it in version history path)
    const oldFilePath = path.join(__dirname, '../../', existingAttachment.path);
    if (fs.existsSync(oldFilePath)) {
      // Move old file to archive/version folder
      const archiveDir = path.join(__dirname, '../../uploads/attachments/archive');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      const archivePath = path.join(archiveDir, `v${existingAttachment.version}-${existingAttachment.filename}`);
      fs.renameSync(oldFilePath, archivePath);
    }

    // Update attachment with new file
    const updatedAttachment = await prisma.documentNodeAttachment.update({
      where: { id: attachmentId },
      data: {
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        path: `uploads/attachments/${file.filename}`,
        description: description || existingAttachment.description,
        version: newVersion,
        updatedById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create version record
    await prisma.documentNodeAttachmentVersion.create({
      data: {
        attachmentId: attachmentId,
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        path: `uploads/attachments/${file.filename}`,
        version: newVersion,
        changeReason: changeReason || `Updated to version ${newVersion}`,
        createdById: userId
      }
    });

    res.json(updatedAttachment);
  } catch (error) {
    console.error('Update attachment error:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after update error:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Failed to update attachment' });
  }
};

/**
 * Soft delete an attachment (revisionssicher)
 */
export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user!.id;

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to delete attachments' });
    }

    // Get attachment
    const attachment = await prisma.documentNodeAttachment.findFirst({
      where: {
        id: attachmentId,
        isActive: true,
        deletedAt: null
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check node-specific write access
    const hasAccess = await hasNodeWriteAccess(userId, attachment.documentNodeId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to modify this document' });
    }

    // Soft delete (keep file and all history)
    await prisma.documentNodeAttachment.update({
      where: { id: attachmentId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedById: userId
      }
    });

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

/**
 * Download an attachment
 */
export const downloadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Get attachment
    const attachment = await prisma.documentNodeAttachment.findFirst({
      where: {
        id: attachmentId,
        isActive: true,
        deletedAt: null
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.join(__dirname, '../../', attachment.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, attachment.originalFilename);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

/**
 * Get version history of an attachment
 */
export const getAttachmentVersions = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Check if attachment exists
    const attachment = await prisma.documentNodeAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Get all versions
    const versions = await prisma.documentNodeAttachmentVersion.findMany({
      where: {
        attachmentId: attachmentId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        version: 'desc'
      }
    });

    res.json(versions);
  } catch (error) {
    console.error('Get attachment versions error:', error);
    res.status(500).json({ error: 'Failed to get attachment versions' });
  }
};

/**
 * Download a specific version of an attachment
 */
export const downloadAttachmentVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { versionId } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Get version
    const version = await prisma.documentNodeAttachmentVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Check if it's the current version or an archived version
    let filePath = path.join(__dirname, '../../', version.path);
    
    // If not found, check archive
    if (!fs.existsSync(filePath)) {
      const archivePath = path.join(__dirname, '../../uploads/attachments/archive', `v${version.version}-${version.filename}`);
      if (fs.existsSync(archivePath)) {
        filePath = archivePath;
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, `v${version.version}-${version.originalFilename}`);
  } catch (error) {
    console.error('Download attachment version error:', error);
    res.status(500).json({ error: 'Failed to download attachment version' });
  }
};

/**
 * Update attachment metadata (description only, no file change)
 */
export const updateAttachmentMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user!.id;
    const { description } = req.body;

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to update attachments' });
    }

    // Get attachment
    const attachment = await prisma.documentNodeAttachment.findFirst({
      where: {
        id: attachmentId,
        isActive: true,
        deletedAt: null
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check node-specific write access
    const hasAccess = await hasNodeWriteAccess(userId, attachment.documentNodeId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to modify this document' });
    }

    // Update only metadata (no version change)
    const updatedAttachment = await prisma.documentNodeAttachment.update({
      where: { id: attachmentId },
      data: {
        description,
        updatedById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedAttachment);
  } catch (error) {
    console.error('Update attachment metadata error:', error);
    res.status(500).json({ error: 'Failed to update attachment metadata' });
  }
};
