import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { checkModulePermission } from '../services/module.service';

const prisma = new PrismaClient();

interface SearchResult {
  id: string;
  type: 'node' | 'attachment' | 'version';
  nodeId: string;
  title: string;
  snippet: string;
  path: string[];
  relevance: number;
  metadata: {
    type?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
      firstName: string;
      lastName: string;
    };
    attachmentId?: string;
    version?: number;
    fileSize?: number;
    mimeType?: string;
  };
}

/**
 * Helper function to check if user has access to a specific node
 */
async function hasNodeAccess(userId: string, nodeId: string): Promise<boolean> {
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

  const nodePermissions = await prisma.documentNodeGroupPermission.findMany({
    where: { documentNodeId: nodeId }
  });

  // If no permissions are set, allow access
  if (nodePermissions.length === 0) {
    return true;
  }

  return nodePermissions.some(perm => userGroupIds.includes(perm.userGroupId));
}

/**
 * Get breadcrumb path for a node
 */
async function getNodePath(nodeId: string): Promise<string[]> {
  const path: string[] = [];
  let currentId: string | null = nodeId;

  while (currentId) {
    const node: { title: string; parentId: string | null } | null = await prisma.documentNode.findFirst({
      where: { id: currentId, deletedAt: null },
      select: { title: true, parentId: true }
    });

    if (!node) break;

    path.unshift(node.title);
    currentId = node.parentId;
  }

  return path;
}

/**
 * Create snippet with search term highlighting
 */
function createSnippet(text: string, searchTerm: string, maxLength: number = 200): string {
  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);

  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  // Get context around the match
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + searchTerm.length + 150);

  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  // Highlight the search term (case-insensitive)
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  snippet = snippet.replace(regex, '**$1**');

  return snippet;
}

/**
 * Calculate relevance score
 */
function calculateRelevance(
  searchTerm: string,
  title: string,
  content: string,
  type: 'node' | 'attachment' | 'version'
): number {
  const lowerTerm = searchTerm.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  let score = 0;

  // Exact title match = highest score
  if (lowerTitle === lowerTerm) score += 100;
  // Title starts with term
  else if (lowerTitle.startsWith(lowerTerm)) score += 50;
  // Title contains term
  else if (lowerTitle.includes(lowerTerm)) score += 30;

  // Count occurrences in content
  const contentMatches = (lowerContent.match(new RegExp(lowerTerm, 'g')) || []).length;
  score += contentMatches * 5;

  // Type bonus
  if (type === 'node') score += 10;
  else if (type === 'attachment') score += 5;
  else score += 2; // version

  return score;
}

/**
 * Search across document nodes, attachments, and versions
 */
export const searchIntranet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { q, limit = 50, type } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to search intranet' });
    }

    const searchTerm = q.trim();
    if (searchTerm.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }

    const results: SearchResult[] = [];

    // Search in document nodes (if type not specified or is 'node')
    if (!type || type === 'node') {
      const nodes = await prisma.documentNode.findMany({
        where: {
          deletedAt: null,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: parseInt(limit as string)
      });

      for (const node of nodes) {
        // Check access
        const hasAccess = await hasNodeAccess(userId, node.id);
        if (!hasAccess) continue;

        const path = await getNodePath(node.id);
        const snippet = createSnippet(node.content || node.title, searchTerm);
        const relevance = calculateRelevance(searchTerm, node.title, node.content || '', 'node');

        results.push({
          id: node.id,
          type: 'node',
          nodeId: node.id,
          title: node.title,
          snippet,
          path,
          relevance,
          metadata: {
            type: node.type,
            createdAt: node.createdAt,
            updatedAt: node.updatedAt,
            createdBy: node.createdBy
          }
        });
      }
    }

    // Search in attachments (if type not specified or is 'attachment')
    if (!type || type === 'attachment') {
      const attachments = await prisma.documentNodeAttachment.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            { originalFilename: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          documentNode: {
            select: {
              id: true,
              title: true
            }
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: parseInt(limit as string)
      });

      for (const attachment of attachments) {
        // Check access to parent node
        const hasAccess = await hasNodeAccess(userId, attachment.documentNodeId);
        if (!hasAccess) continue;

        const path = await getNodePath(attachment.documentNodeId);
        const searchableText = `${attachment.originalFilename} ${attachment.description || ''}`;
        const snippet = createSnippet(searchableText, searchTerm);
        const relevance = calculateRelevance(
          searchTerm,
          attachment.originalFilename,
          attachment.description || '',
          'attachment'
        );

        results.push({
          id: attachment.id,
          type: 'attachment',
          nodeId: attachment.documentNodeId,
          title: attachment.originalFilename,
          snippet,
          path: [...path, attachment.documentNode.title],
          relevance,
          metadata: {
            createdAt: attachment.createdAt,
            updatedAt: attachment.updatedAt,
            createdBy: attachment.createdBy,
            attachmentId: attachment.id,
            version: attachment.version,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType
          }
        });
      }
    }

    // Search in document versions (if type not specified or is 'version')
    if (!type || type === 'version') {
      const versions = await prisma.documentVersion.findMany({
        where: {
          content: { contains: searchTerm, mode: 'insensitive' }
        },
        include: {
          documentNode: {
            select: {
              id: true,
              title: true,
              deletedAt: true
            }
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: parseInt(limit as string)
      });

      for (const version of versions) {
        // Skip if node is deleted
        if (version.documentNode.deletedAt) continue;

        // Check access
        const hasAccess = await hasNodeAccess(userId, version.documentNodeId);
        if (!hasAccess) continue;

        const path = await getNodePath(version.documentNodeId);
        const snippet = createSnippet(version.content, searchTerm);
        const relevance = calculateRelevance(
          searchTerm,
          version.documentNode.title,
          version.content,
          'version'
        );

        results.push({
          id: version.id,
          type: 'version',
          nodeId: version.documentNodeId,
          title: `${version.documentNode.title} (Version ${version.version})`,
          snippet,
          path,
          relevance,
          metadata: {
            createdAt: version.createdAt,
            updatedAt: version.createdAt,
            createdBy: version.createdBy,
            version: version.version
          }
        });
      }
    }

    // Sort by relevance (highest first)
    results.sort((a, b) => b.relevance - a.relevance);

    // Limit final results
    const limitedResults = results.slice(0, parseInt(limit as string));

    res.json({
      query: searchTerm,
      total: results.length,
      results: limitedResults
    });

  } catch (error) {
    console.error('Intranet search error:', error);
    res.status(500).json({ error: 'Failed to search intranet' });
  }
};

/**
 * Get search suggestions (autocomplete)
 */
export const getSearchSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json([]);
    }

    const hasReadPermission = await checkModulePermission(userId, 'INTRANET', 'READ');
    if (!hasReadPermission) {
      return res.status(403).json({ error: 'No permission to search intranet' });
    }

    const searchTerm = q.trim();
    if (searchTerm.length < 2) {
      return res.json([]);
    }

    // Get matching titles
    const nodes = await prisma.documentNode.findMany({
      where: {
        deletedAt: null,
        title: { contains: searchTerm, mode: 'insensitive' }
      },
      select: {
        id: true,
        title: true
      },
      take: parseInt(limit as string)
    });

    // Filter by access
    const suggestions: { id: string; title: string }[] = [];
    for (const node of nodes) {
      const hasAccess = await hasNodeAccess(userId, node.id);
      if (hasAccess) {
        suggestions.push({ id: node.id, title: node.title });
      }
    }

    res.json(suggestions);

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};
