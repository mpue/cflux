import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { checkModulePermission } from '../services/module.service';
import { actionService } from '../services/action.service';
import {
  createAccessFilter,
  hasNodeAccess,
} from '../services/documentAccess.service';


/**
 * Get the complete document tree structure
 */
export const getDocumentTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Check if user has INTRANET_READ permission
    const hasReadPermission = await checkModulePermission(userId, 'intranet', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    const nodes = await prisma.documentNode.findMany({
      where: { deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' }
        },
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
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Rechte einmal laden, dann im Speicher filtern.
    const access = await createAccessFilter(userId);
    const filteredNodes = nodes.filter((node) => access.canAccess(node.id));

    // Build tree structure with filtered nodes
    const buildTree = (parentId: string | null): any[] => {
      return filteredNodes
        .filter(node => node.parentId === parentId)
        .map(node => ({
          ...node,
          children: buildTree(node.id)
        }));
    };

    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    console.error('Get document tree error:', error);
    res.status(500).json({ error: 'Failed to get document tree' });
  }
};

/**
 * Get a single document node by ID
 */
export const getDocumentNodeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'intranet', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Check node-specific permissions
    const hasAccess = await hasNodeAccess(userId, id, 'READ');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to access this document' });
    }

    const node = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' }
        },
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
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!node) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get user's permission level for this node
    const hasWriteAccess = await hasNodeAccess(userId, id, 'WRITE');
    const hasAdminAccess = await hasNodeAccess(userId, id, 'ADMIN');

    res.json({
      ...node,
      userPermissions: {
        canRead: true, // Already checked above
        canWrite: hasWriteAccess,
        canAdmin: hasAdminAccess
      }
    });
  } catch (error) {
    console.error('Get document node error:', error);
    res.status(500).json({ error: 'Failed to get document node' });
  }
};

/**
 * Get document content (current version)
 */
export const getDocumentContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'intranet', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Check node-specific permissions
    const hasAccess = await hasNodeAccess(userId, id, 'READ');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to access this document' });
    }

    const node = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!node) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (node.type !== 'DOCUMENT') {
      return res.status(400).json({ error: 'Node is not a document' });
    }

    res.json({ content: node.content });
  } catch (error) {
    console.error('Get document content error:', error);
    res.status(500).json({ error: 'Failed to get document content' });
  }
};

/**
 * Get breadcrumb path for a document node
 */
export const getBreadcrumb = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'intranet', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Das Gruppenrecht des Dokuments gilt auch hier — sonst liesse sich ueber
    // diesen Weg lesen, was ueber /:id gesperrt ist.
    const hasAccess = await hasNodeAccess(userId, id, 'READ');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to access this document' });
    }

    const breadcrumb: any[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const node: { id: string; title: string; parentId: string | null; type: string } | null = await prisma.documentNode.findFirst({
        where: {
          id: currentId,
          deletedAt: null
        },
        select: {
          id: true,
          title: true,
          parentId: true,
          type: true
        }
      });

      if (!node) break;

      breadcrumb.unshift(node);
      currentId = node.parentId;
    }

    res.json(breadcrumb);
  } catch (error) {
    console.error('Get breadcrumb error:', error);
    res.status(500).json({ error: 'Failed to get breadcrumb' });
  }
};

/**
 * Create a new document node (folder or document)
 */
export const createDocumentNode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const hasWritePermission = await checkModulePermission(userId, 'intranet', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to create intranet documents' });
    }

    const {
      title,
      type,
      parentId,
      content,
      order
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    if (!['FOLDER', 'DOCUMENT'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be FOLDER or DOCUMENT' });
    }

    // In einen geschuetzten Ordner darf nur hineinlegen, wer dort auch
    // schreiben darf. Sonst koennte jeder mit dem Modulrecht Inhalte in
    // fremden Bereichen ablegen.
    if (parentId) {
      const mayWriteToParent = await hasNodeAccess(userId, parentId, 'WRITE');
      if (!mayWriteToParent) {
        return res.status(403).json({ error: 'No permission to access this folder' });
      }
    }

    // Calculate order if not provided
    let nodeOrder = order;
    if (nodeOrder === undefined) {
      const siblings = await prisma.documentNode.count({
        where: {
          parentId: parentId || null,
          deletedAt: null
        }
      });
      nodeOrder = siblings;
    }

    const node = await prisma.documentNode.create({
      data: {
        title,
        type,
        parentId: parentId || null,
        content: content || '',
        order: nodeOrder,
        createdById: userId,
        updatedById: userId,
        approvalStatus: 'DRAFT' // All new documents start as DRAFT
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

    // Create initial version if it's a document
    if (type === 'DOCUMENT') {
      await prisma.documentVersion.create({
        data: {
          documentNodeId: node.id,
          content: content || '',
          version: 1,
          createdById: userId
        }
      });
    }

    // Trigger document.created action
    try {
      await actionService.triggerAction('document.created', {
        entityType: 'DOCUMENT',
        entityId: node.id,
        userId: userId,
        title: node.title,
        type: node.type,
        parentId: node.parentId,
        createdAt: node.createdAt.toISOString()
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger document.created:', actionError);
      // Don't fail the request if action fails
    }

    res.status(201).json(node);
  } catch (error) {
    console.error('Create document node error:', error);
    res.status(500).json({ error: 'Failed to create document node' });
  }
};

/**
 * Update a document node
 */
export const updateDocumentNode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasWritePermission = await checkModulePermission(userId, 'intranet', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to update intranet documents' });
    }

    // Check node-specific permissions
    const hasAccess = await hasNodeAccess(userId, id, 'WRITE');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to edit this document' });
    }

    const existingNode = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!existingNode) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const {
      title,
      content,
      order
    } = req.body;

    const updateData: any = {
      updatedById: userId,
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (order !== undefined) updateData.order = order;

    // If content is being updated and it's a document, create a new version
    if (content !== undefined && existingNode.type === 'DOCUMENT') {
      updateData.content = content;

      // Get the latest version number
      const latestVersion = await prisma.documentVersion.findFirst({
        where: { documentNodeId: id },
        orderBy: { version: 'desc' }
      });

      const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

      await prisma.documentVersion.create({
        data: {
          documentNodeId: id,
          content,
          version: nextVersion,
          createdById: userId
        }
      });
    }

    const node = await prisma.documentNode.update({
      where: { id },
      data: updateData,
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

    // Trigger document.updated action
    try {
      await actionService.triggerAction('document.updated', {
        entityType: 'DOCUMENT',
        entityId: node.id,
        userId: userId,
        title: node.title,
        type: node.type,
        contentChanged: content !== undefined,
        updatedAt: node.updatedAt.toISOString()
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger document.updated:', actionError);
      // Don't fail the request if action fails
    }

    res.json(node);
  } catch (error) {
    console.error('Update document node error:', error);
    res.status(500).json({ error: 'Failed to update document node' });
  }
};

/**
 * Soft delete a document node (and all its children)
 */
export const deleteDocumentNode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasWritePermission = await checkModulePermission(userId, 'intranet', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to delete intranet documents' });
    }

    // Check node-specific permissions
    const hasAccess = await hasNodeAccess(userId, id, 'WRITE');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to delete this document' });
    }

    const node = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!node) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Recursively soft delete all children
    const deleteRecursive = async (nodeId: string) => {
      const children = await prisma.documentNode.findMany({
        where: {
          parentId: nodeId,
          deletedAt: null
        }
      });

      for (const child of children) {
        await deleteRecursive(child.id);
      }

      await prisma.documentNode.update({
        where: { id: nodeId },
        data: {
          deletedAt: new Date(),
          updatedById: userId
        }
      });
    };

    await deleteRecursive(id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document node error:', error);
    res.status(500).json({ error: 'Failed to delete document node' });
  }
};

/**
 * Move a document node to a new parent
 */
export const moveDocumentNode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasWritePermission = await checkModulePermission(userId, 'intranet', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to move intranet documents' });
    }

    const { newParentId, newOrder } = req.body;

    const node = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!node) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verschieben braucht das Schreibrecht an beiden Enden.
    //
    // Die Quelle ist dabei die wichtigere Haelfte: ohne sie liesse sich ein
    // geschuetztes Dokument aus seinem Ordner herausziehen und verloere dabei
    // den geerbten Schutz — die Vererbung waere mit einem Handgriff ausgehebelt.
    const mayMoveSource = await hasNodeAccess(userId, id, 'WRITE');
    if (!mayMoveSource) {
      return res.status(403).json({ error: 'No permission to access this document' });
    }

    if (newParentId) {
      const mayWriteToTarget = await hasNodeAccess(userId, newParentId, 'WRITE');
      if (!mayWriteToTarget) {
        return res.status(403).json({ error: 'No permission to access this folder' });
      }
    }

    // Check if newParentId exists (if provided)
    if (newParentId) {
      const parentNode = await prisma.documentNode.findFirst({
        where: {
          id: newParentId,
          deletedAt: null,
          type: 'FOLDER'
        }
      });

      if (!parentNode) {
        return res.status(400).json({ error: 'Invalid parent folder' });
      }

      // Check for circular reference
      let currentParent = parentNode;
      while (currentParent.parentId) {
        if (currentParent.parentId === id) {
          return res.status(400).json({ error: 'Cannot move folder into its own child' });
        }
        const nextParent = await prisma.documentNode.findUnique({
          where: { id: currentParent.parentId }
        });
        if (!nextParent) break;
        currentParent = nextParent;
      }
    }

    // Calculate order if not provided
    let order = newOrder;
    if (order === undefined) {
      const siblings = await prisma.documentNode.count({
        where: {
          parentId: newParentId || null,
          deletedAt: null,
          id: { not: id }
        }
      });
      order = siblings;
    }

    const updatedNode = await prisma.documentNode.update({
      where: { id },
      data: {
        parentId: newParentId || null,
        order,
        updatedById: userId,
        updatedAt: new Date()
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

    res.json(updatedNode);
  } catch (error) {
    console.error('Move document node error:', error);
    res.status(500).json({ error: 'Failed to move document node' });
  }
};

/**
 * Get version history for a document
 */
export const getVersionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'intranet', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Das Gruppenrecht des Dokuments gilt auch hier — sonst liesse sich ueber
    // diesen Weg lesen, was ueber /:id gesperrt ist.
    const hasAccess = await hasNodeAccess(userId, id, 'READ');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to access this document' });
    }

    const node = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null,
        type: 'DOCUMENT'
      }
    });

    if (!node) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentNodeId: id },
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
      orderBy: { version: 'desc' }
    });

    res.json(versions);
  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({ error: 'Failed to get version history' });
  }
};

/**
 * Get content of a specific version
 */
export const getVersionContent = async (req: AuthRequest, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'intranet', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    // Das Gruppenrecht des Dokuments gilt auch hier — sonst liesse sich ueber
    // diesen Weg lesen, was ueber /:id gesperrt ist.
    const hasAccess = await hasNodeAccess(userId, id, 'READ');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to access this document' });
    }

    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentNodeId: id
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
      }
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(version);
  } catch (error) {
    console.error('Get version content error:', error);
    res.status(500).json({ error: 'Failed to get version content' });
  }
};

/**
 * Restore a specific version
 */
export const restoreVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user!.id;

    const hasWritePermission = await checkModulePermission(userId, 'intranet', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to restore intranet document versions' });
    }

    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentNodeId: id
      }
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Get the latest version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentNodeId: id },
      orderBy: { version: 'desc' }
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Create a new version with the restored content
    const restoredVersion = await prisma.documentVersion.create({
      data: {
        documentNodeId: id,
        content: version.content,
        version: nextVersion,
        createdById: userId
      }
    });

    // Update the document node with the restored content
    const node = await prisma.documentNode.update({
      where: { id },
      data: {
        content: version.content,
        updatedById: userId,
        updatedAt: new Date()
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

    res.json({ node, version: restoredVersion });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
};

/**
 * Get group permissions for a document node
 */
export const getGroupPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'intranet', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
    }

    const permissions = await prisma.documentNodeGroupPermission.findMany({
      where: { documentNodeId: id },
      include: {
        userGroup: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.json(permissions);
  } catch (error) {
    console.error('Get group permissions error:', error);
    res.status(500).json({ error: 'Failed to get group permissions' });
  }
};

/**
 * Set group permissions for a document node
 */
export const setGroupPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const hasWritePermission = await checkModulePermission(userId, 'intranet', 'WRITE');
    if (!hasWritePermission) {
      return res.status(403).json({ error: 'No permission to manage intranet permissions' });
    }

    const { permissions } = req.body; // Array of { userGroupId, permissionLevel }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    // Delete existing permissions
    await prisma.documentNodeGroupPermission.deleteMany({
      where: { documentNodeId: id }
    });

    // Create new permissions
    if (permissions.length > 0) {
      await prisma.documentNodeGroupPermission.createMany({
        data: permissions.map((perm: any) => ({
          documentNodeId: id,
          userGroupId: perm.userGroupId,
          permissionLevel: perm.permissionLevel || 'READ',
          inherited: false
        }))
      });
    }

    // Get updated permissions with group details
    const updatedPermissions = await prisma.documentNodeGroupPermission.findMany({
      where: { documentNodeId: id },
      include: {
        userGroup: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.json(updatedPermissions);
  } catch (error) {
    console.error('Set group permissions error:', error);
    res.status(500).json({ error: 'Failed to set group permissions' });
  }
};

/**
 * Submit a document for approval
 */
export const submitDocumentForApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approverUserId } = req.body;
    const userId = req.user!.id;

    if (!approverUserId) {
      return res.status(400).json({ error: 'Genehmiger muss ausgewählt werden' });
    }

    // Check if user has write permission on the document
    const hasAccess = await hasNodeAccess(userId, id, 'WRITE');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to submit this document' });
    }

    // Get the document
    const document = await prisma.documentNode.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.approvalStatus !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft documents can be submitted for approval' });
    }

    // Verify approver exists and has admin rights
    const approver = await prisma.user.findUnique({
      where: { id: approverUserId }
    });

    if (!approver || !approver.isActive) {
      return res.status(400).json({ error: 'Invalid approver user' })  }

    // Update document status
    const updatedDocument = await prisma.documentNode.update({
      where: { id },
      data: {
        approvalStatus: 'PENDING_REVIEW',
        submittedForApprovalAt: new Date(),
        assignedApproverId: approverUserId
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Trigger workflow action
    await actionService.triggerAction('intranet.document.submitted', {
      documentId: document.id,
      documentTitle: document.title,
      documentType: document.type,
      submittedBy: userId,
      submittedAt: new Date().toISOString()
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Submit document for approval error:', error);
    res.status(500).json({ error: 'Failed to submit document for approval' });
  }
};

/**
 * Approve a document
 */
export const approveDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user has admin permission on the document
    const hasAccess = await hasNodeAccess(userId, id, 'ADMIN');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to approve this document' });
    }

    // Get the document
    const document = await prisma.documentNode.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.approvalStatus !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: 'Only documents pending review can be approved' });
    }

    // Update document status
    const updatedDocument = await prisma.documentNode.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Trigger workflow action
    await actionService.triggerAction('intranet.document.approved', {
      documentId: document.id,
      documentTitle: document.title,
      documentType: document.type,
      approvedBy: userId,
      approvedAt: new Date().toISOString()
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({ error: 'Failed to approve document' });
  }
};

/**
 * Reject a document
 */
export const rejectDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Check if user has admin permission on the document
    const hasAccess = await hasNodeAccess(userId, id, 'ADMIN');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to reject this document' });
    }

    // Get the document
    const document = await prisma.documentNode.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.approvalStatus !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: 'Only documents pending review can be rejected' });
    }

    // Update document status
    const updatedDocument = await prisma.documentNode.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: userId,
        rejectionReason: reason,
        approvedAt: null,
        approvedById: null
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Trigger workflow action
    await actionService.triggerAction('intranet.document.rejected', {
      documentId: document.id,
      documentTitle: document.title,
      documentType: document.type,
      rejectedBy: userId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({ error: 'Failed to reject document' });
  }
};

/**
 * Publish a document
 */
export const publishDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user has admin permission on the document
    const hasAccess = await hasNodeAccess(userId, id, 'ADMIN');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to publish this document' });
    }

    // Get the document
    const document = await prisma.documentNode.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.approvalStatus !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved documents can be published' });
    }

    // Update document status
    const updatedDocument = await prisma.documentNode.update({
      where: { id },
      data: {
        approvalStatus: 'PUBLISHED',
        publishedAt: new Date()
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Trigger workflow action
    await actionService.triggerAction('intranet.document.published', {
      documentId: document.id,
      documentTitle: document.title,
      documentType: document.type,
      publishedAt: new Date().toISOString()
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Publish document error:', error);
    res.status(500).json({ error: 'Failed to publish document' });
  }
};

/**
 * Return a document to draft status
 */
export const returnDocumentToDraft = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user has write permission on the document
    const hasAccess = await hasNodeAccess(userId, id, 'WRITE');
    if (!hasAccess) {
      return res.status(403).json({ error: 'No permission to modify this document' });
    }

    // Get the document
    const document = await prisma.documentNode.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.approvalStatus !== 'REJECTED' && document.approvalStatus !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: 'Only rejected or pending documents can be returned to draft' });
    }

    // Update document status
    const updatedDocument = await prisma.documentNode.update({
      where: { id },
      data: {
        approvalStatus: 'DRAFT',
        submittedForApprovalAt: null,
        approvedAt: null,
        approvedById: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
        publishedAt: null
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Return document to draft error:', error);
    res.status(500).json({ error: 'Failed to return document to draft' });
  }
};

/**
 * Get pending approval documents (for current user as approver)
 */
export const getPendingApprovals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get documents assigned to this user for approval
    const documents = await prisma.documentNode.findMany({
      where: {
        approvalStatus: 'PENDING_REVIEW',
        assignedApproverId: userId,
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
        assignedApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedForApprovalAt: 'asc'
      }
    });

    // Format response similar to workflow instances
    const formattedDocuments = documents.map(doc => ({
      document: {
        id: doc.id,
        title: doc.title,
        type: doc.type,
        approvalStatus: doc.approvalStatus,
        createdBy: doc.createdBy
      },
      workflowInstance: {
        id: doc.workflowInstanceId || doc.id,
        createdAt: doc.submittedForApprovalAt || doc.createdAt
      },
      assignedStep: {
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days default
      }
    }));

    res.json(formattedDocuments);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Failed to get pending approvals' });
  }
};

