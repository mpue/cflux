import api from './api';

export interface DocumentNode {
  id: string;
  title: string;
  type: 'FOLDER' | 'DOCUMENT';
  content: string;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdById: string;
  updatedById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  children?: DocumentNode[];
}

export interface DocumentVersion {
  id: string;
  documentNodeId: string;
  content: string;
  version: number;
  createdAt: string;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateDocumentNodeData {
  title: string;
  type: 'FOLDER' | 'DOCUMENT';
  parentId?: string;
  content?: string;
  order?: number;
}

export interface UpdateDocumentNodeData {
  title?: string;
  content?: string;
  order?: number;
}

export interface MoveDocumentNodeData {
  newParentId?: string;
  newOrder?: number;
}

export const documentNodeService = {
  // Get the complete document tree
  getTree: async (): Promise<DocumentNode[]> => {
    const response = await api.get('/intranet/tree');
    return response.data;
  },

  // Get a single document node by ID
  getById: async (id: string): Promise<DocumentNode> => {
    const response = await api.get(`/intranet/${id}`);
    return response.data;
  },

  // Get document content
  getContent: async (id: string): Promise<{ content: string }> => {
    const response = await api.get(`/intranet/${id}/content`);
    return response.data;
  },

  // Get breadcrumb path for a document
  getBreadcrumb: async (id: string): Promise<DocumentNode[]> => {
    const response = await api.get(`/intranet/${id}/breadcrumb`);
    return response.data;
  },

  // Create a new document node
  create: async (data: CreateDocumentNodeData): Promise<DocumentNode> => {
    const response = await api.post('/intranet', data);
    return response.data;
  },

  // Update a document node
  update: async (id: string, data: UpdateDocumentNodeData): Promise<DocumentNode> => {
    const response = await api.put(`/intranet/${id}`, data);
    return response.data;
  },

  // Delete a document node
  delete: async (id: string): Promise<void> => {
    await api.delete(`/intranet/${id}`);
  },

  // Move a document node
  move: async (id: string, data: MoveDocumentNodeData): Promise<DocumentNode> => {
    const response = await api.post(`/intranet/${id}/move`, data);
    return response.data;
  },

  // Get version history
  getVersionHistory: async (id: string): Promise<DocumentVersion[]> => {
    const response = await api.get(`/intranet/${id}/versions`);
    return response.data;
  },

  // Get content of a specific version
  getVersionContent: async (id: string, versionId: string): Promise<DocumentVersion> => {
    const response = await api.get(`/intranet/${id}/versions/${versionId}`);
    return response.data;
  },

  // Restore a specific version
  restoreVersion: async (id: string, versionId: string): Promise<{ node: DocumentNode; version: DocumentVersion }> => {
    const response = await api.post(`/intranet/${id}/restore/${versionId}`);
    return response.data;
  },
};

export default documentNodeService;
