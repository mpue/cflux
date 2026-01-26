import { documentNodeService } from '../documentNode.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('documentNodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNode = {
    id: '1',
    title: 'Test Document',
    type: 'DOCUMENT' as const,
    content: 'Test content',
    parentId: null,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    createdById: 'user1',
    updatedById: 'user1',
    approvalStatus: 'DRAFT' as const,
    createdBy: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    updatedBy: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
  };

  describe('getTree', () => {
    it('should fetch the complete document tree', async () => {
      const mockTree = [mockNode];
      mockApi.get.mockResolvedValue({ data: mockTree });

      const result = await documentNodeService.getTree();

      expect(mockApi.get).toHaveBeenCalledWith('/intranet/tree');
      expect(result).toEqual(mockTree);
    });
  });

  describe('getById', () => {
    it('should fetch a document node by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockNode });

      const result = await documentNodeService.getById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/intranet/1');
      expect(result).toEqual(mockNode);
    });
  });

  describe('getContent', () => {
    it('should fetch document content', async () => {
      const mockContent = { content: 'Test content' };
      mockApi.get.mockResolvedValue({ data: mockContent });

      const result = await documentNodeService.getContent('1');

      expect(mockApi.get).toHaveBeenCalledWith('/intranet/1/content');
      expect(result).toEqual(mockContent);
    });
  });

  describe('getBreadcrumb', () => {
    it('should fetch breadcrumb path', async () => {
      const mockBreadcrumb = [
        { ...mockNode, id: 'root', title: 'Root' },
        { ...mockNode, id: '1', title: 'Document', parentId: 'root' }
      ];
      mockApi.get.mockResolvedValue({ data: mockBreadcrumb });

      const result = await documentNodeService.getBreadcrumb('1');

      expect(mockApi.get).toHaveBeenCalledWith('/intranet/1/breadcrumb');
      expect(result).toEqual(mockBreadcrumb);
    });
  });

  describe('create', () => {
    it('should create a new document node', async () => {
      const createData = {
        title: 'New Document',
        type: 'DOCUMENT' as const,
        content: 'Content',
        parentId: 'parent1'
      };
      mockApi.post.mockResolvedValue({ data: mockNode });

      const result = await documentNodeService.create(createData);

      expect(mockApi.post).toHaveBeenCalledWith('/intranet', createData);
      expect(result).toEqual(mockNode);
    });
  });

  describe('update', () => {
    it('should update a document node', async () => {
      const updateData = { title: 'Updated Title', content: 'Updated content' };
      mockApi.put.mockResolvedValue({ data: { ...mockNode, ...updateData } });

      const result = await documentNodeService.update('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/intranet/1', updateData);
      expect(result.title).toEqual('Updated Title');
    });
  });

  describe('delete', () => {
    it('should delete a document node', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await documentNodeService.delete('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/intranet/1');
    });
  });

  describe('move', () => {
    it('should move a document node', async () => {
      const moveData = { newParentId: 'parent2', newOrder: 5 };
      mockApi.post.mockResolvedValue({ data: { ...mockNode, parentId: 'parent2', order: 5 } });

      const result = await documentNodeService.move('1', moveData);

      expect(mockApi.post).toHaveBeenCalledWith('/intranet/1/move', moveData);
      expect(result.parentId).toEqual('parent2');
      expect(result.order).toEqual(5);
    });
  });

  describe('getVersionHistory', () => {
    it('should fetch version history', async () => {
      const mockVersions = [
        {
          id: 'v1',
          documentNodeId: '1',
          content: 'Old content',
          version: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          createdById: 'user1',
          createdBy: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        }
      ];
      mockApi.get.mockResolvedValue({ data: mockVersions });

      const result = await documentNodeService.getVersionHistory('1');

      expect(mockApi.get).toHaveBeenCalledWith('/intranet/1/versions');
      expect(result).toEqual(mockVersions);
    });
  });

  describe('getVersionContent', () => {
    it('should fetch content of a specific version', async () => {
      const mockVersion = {
        id: 'v1',
        documentNodeId: '1',
        content: 'Version content',
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        createdById: 'user1',
        createdBy: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      };
      mockApi.get.mockResolvedValue({ data: mockVersion });

      const result = await documentNodeService.getVersionContent('1', 'v1');

      expect(mockApi.get).toHaveBeenCalledWith('/intranet/1/versions/v1');
      expect(result).toEqual(mockVersion);
    });
  });

  describe('restoreVersion', () => {
    it('should restore a specific version', async () => {
      const mockResponse = {
        node: mockNode,
        version: {
          id: 'v1',
          documentNodeId: '1',
          content: 'Restored content',
          version: 2,
          createdAt: '2024-01-02T00:00:00.000Z',
          createdById: 'user1',
          createdBy: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        }
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await documentNodeService.restoreVersion('1', 'v1');

      expect(mockApi.post).toHaveBeenCalledWith('/intranet/1/restore/v1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('importZip', () => {
    it('should import a zip file', async () => {
      const mockFile = new File(['content'], 'test.zip', { type: 'application/zip' });
      const mockResponse = {
        message: 'Import successful',
        rootFolderId: 'folder1',
        rootFolderTitle: 'Imported Folder'
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await documentNodeService.importZip(mockFile);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/intranet/import/zip',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should import a zip file with parentId', async () => {
      const mockFile = new File(['content'], 'test.zip', { type: 'application/zip' });
      const mockResponse = {
        message: 'Import successful',
        rootFolderId: 'folder1',
        rootFolderTitle: 'Imported Folder'
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await documentNodeService.importZip(mockFile, 'parent1');

      const callArgs = mockApi.post.mock.calls[0];
      const formData = callArgs[1] as FormData;
      
      expect(mockApi.post).toHaveBeenCalled();
      expect(callArgs[0]).toBe('/intranet/import/zip');
    });
  });

  describe('getGroupPermissions', () => {
    it('should fetch group permissions', async () => {
      const mockPermissions = [
        {
          id: 'perm1',
          documentNodeId: '1',
          userGroupId: 'group1',
          permissionLevel: 'READ' as const,
          userGroup: { id: 'group1', name: 'Readers', color: '#blue' }
        }
      ];
      mockApi.get.mockResolvedValue({ data: mockPermissions });

      const result = await documentNodeService.getGroupPermissions('1');

      expect(mockApi.get).toHaveBeenCalledWith('/intranet/1/permissions');
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('setGroupPermissions', () => {
    it('should set group permissions', async () => {
      const permissionsData = {
        permissions: [
          { userGroupId: 'group1', permissionLevel: 'READ' as const },
          { userGroupId: 'group2', permissionLevel: 'WRITE' as const }
        ]
      };
      const mockResponse = [
        {
          id: 'perm1',
          documentNodeId: '1',
          userGroupId: 'group1',
          permissionLevel: 'READ' as const,
          userGroup: { id: 'group1', name: 'Readers', color: '#blue' }
        }
      ];
      mockApi.put.mockResolvedValue({ data: mockResponse });

      const result = await documentNodeService.setGroupPermissions('1', permissionsData);

      expect(mockApi.put).toHaveBeenCalledWith('/intranet/1/permissions', permissionsData);
      expect(result).toEqual(mockResponse);
    });
  });
});
