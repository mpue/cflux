import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { checkModulePermission } from '../services/module.service';
import { actionService } from '../services/action.service';

const prisma = new PrismaClient();

/**
 * Helper function to check if a user has access to a specific node based on group permissions
 * If no group permissions are set, access is granted to all users with INTRANET permission
 */
async function hasNodeAccess(userId: string, nodeId: string, requiredLevel: 'READ' | 'WRITE' | 'ADMIN' = 'READ'): Promise<boolean> {
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

  // If no permissions are set, allow access (open access)
  if (nodePermissions.length === 0) {
    return true;
  }

  // Check if user's groups have the required permission level
  const permissionLevelRanks = { READ: 1, WRITE: 2, ADMIN: 3 };
  const requiredRank = permissionLevelRanks[requiredLevel];

  for (const perm of nodePermissions) {
    if (userGroupIds.includes(perm.userGroupId)) {
      const permRank = permissionLevelRanks[perm.permissionLevel];
      if (permRank >= requiredRank) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter nodes based on user's group permissions
 */
async function filterNodesByAccess(nodes: any[], userId: string): Promise<any[]> {
  const filteredNodes = [];
  
  for (const node of nodes) {
    const hasAccess = await hasNodeAccess(userId, node.id, 'READ');
    if (hasAccess) {
      filteredNodes.push(node);
    }
  }
  
  return filteredNodes;
}

/**
 * Get the complete document tree structure
 */
export const getDocumentTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Check if user has INTRANET_READ permission
    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
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
        }
      },
      orderBy: { order: 'asc' }
    });

    // Filter nodes based on group permissions
    const filteredNodes = await filterNodesByAccess(nodes, userId);

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

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
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
        }
      }
    });

    if (!node) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(node);
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

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
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

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
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

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
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

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
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

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
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

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
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

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
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

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to read intranet documents' });
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

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
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

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
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

    const hasWritePermission = await checkModulePermission(userId, 'INTRANET', 'WRITE');
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
