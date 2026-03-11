import { documentNodeAttachmentService } from '../documentNodeAttachment.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('documentNodeAttachmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAttachment = {
    id: 'att-1',
    documentNodeId: 'node-1',
    filename: 'abc123.pdf',
    originalFilename: 'report.pdf',
    mimeType: 'application/pdf',
    fileSize: 51200,
    path: '/uploads/abc123.pdf',
    description: 'Monthly report',
    version: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    createdBy: { id: 'user-1', firstName: 'Max', lastName: 'Muster', email: 'max@test.com' },
    updatedBy: { id: 'user-1', firstName: 'Max', lastName: 'Muster', email: 'max@test.com' },
  };

  const mockVersion = {
    id: 'ver-1',
    attachmentId: 'att-1',
    filename: 'abc123.pdf',
    originalFilename: 'report.pdf',
    mimeType: 'application/pdf',
    fileSize: 51200,
    path: '/uploads/abc123.pdf',
    version: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    createdBy: { id: 'user-1', firstName: 'Max', lastName: 'Muster', email: 'max@test.com' },
  };

  describe('getNodeAttachments', () => {
    it('should fetch attachments for a node', async () => {
      mockApi.get.mockResolvedValue({ data: [mockAttachment] });

      const result = await documentNodeAttachmentService.getNodeAttachments('node-1');

      expect(mockApi.get).toHaveBeenCalledWith('/document-nodes/node-1/attachments');
      expect(result).toEqual([mockAttachment]);
    });
  });

  describe('uploadAttachment', () => {
    it('should upload an attachment', async () => {
      mockApi.post.mockResolvedValue({ data: mockAttachment });
      const file = new File(['test'], 'report.pdf', { type: 'application/pdf' });

      const result = await documentNodeAttachmentService.uploadAttachment('node-1', file, 'Monthly report');

      expect(mockApi.post).toHaveBeenCalledWith(
        '/document-nodes/node-1/attachments',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockAttachment);
    });

    it('should upload without description', async () => {
      mockApi.post.mockResolvedValue({ data: mockAttachment });
      const file = new File(['test'], 'report.pdf', { type: 'application/pdf' });

      await documentNodeAttachmentService.uploadAttachment('node-1', file);

      expect(mockApi.post).toHaveBeenCalled();
    });
  });

  describe('updateAttachment', () => {
    it('should update an attachment with new file', async () => {
      mockApi.put.mockResolvedValue({ data: { ...mockAttachment, version: 2 } });
      const file = new File(['new'], 'report-v2.pdf', { type: 'application/pdf' });

      const result = await documentNodeAttachmentService.updateAttachment('att-1', file, 'Updated', 'New version');

      expect(mockApi.put).toHaveBeenCalledWith(
        '/document-nodes/attachments/att-1',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result.version).toBe(2);
    });
  });

  describe('updateAttachmentMetadata', () => {
    it('should update attachment metadata only', async () => {
      mockApi.patch.mockResolvedValue({ data: { ...mockAttachment, description: 'New desc' } });

      const result = await documentNodeAttachmentService.updateAttachmentMetadata('att-1', 'New desc');

      expect(mockApi.patch).toHaveBeenCalledWith(
        '/document-nodes/attachments/att-1/metadata',
        { description: 'New desc' }
      );
      expect(result.description).toBe('New desc');
    });
  });

  describe('deleteAttachment', () => {
    it('should delete an attachment', async () => {
      mockApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      const result = await documentNodeAttachmentService.deleteAttachment('att-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/document-nodes/attachments/att-1');
      expect(result.message).toBe('Deleted');
    });
  });

  describe('getAttachmentVersions', () => {
    it('should fetch attachment versions', async () => {
      mockApi.get.mockResolvedValue({ data: [mockVersion] });

      const result = await documentNodeAttachmentService.getAttachmentVersions('att-1');

      expect(mockApi.get).toHaveBeenCalledWith('/document-nodes/attachments/att-1/versions');
      expect(result).toEqual([mockVersion]);
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(documentNodeAttachmentService.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format KB', () => {
      expect(documentNodeAttachmentService.formatFileSize(1024)).toBe('1 KB');
    });

    it('should format MB', () => {
      expect(documentNodeAttachmentService.formatFileSize(1048576)).toBe('1 MB');
    });
  });
});
