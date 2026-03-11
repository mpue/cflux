import { documentNodeSearchService } from '../documentNodeSearch.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('documentNodeSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSearchResponse = {
    query: 'test',
    total: 2,
    results: [
      {
        id: 'node-1',
        type: 'node' as const,
        nodeId: 'node-1',
        title: 'Test Document',
        snippet: 'This is a test document.',
        path: ['Root', 'Folder'],
        relevance: 0.95,
        metadata: {
          type: 'DOCUMENT',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          createdBy: { firstName: 'Max', lastName: 'Muster' },
        },
      },
      {
        id: 'att-1',
        type: 'attachment' as const,
        nodeId: 'node-2',
        title: 'test.pdf',
        snippet: 'Content of PDF.',
        path: ['Root'],
        relevance: 0.8,
        metadata: {
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          createdBy: { firstName: 'Max', lastName: 'Muster' },
          attachmentId: 'att-1',
          mimeType: 'application/pdf',
          fileSize: 51200,
        },
      },
    ],
  };

  describe('search', () => {
    it('should search with query and default limit', async () => {
      mockApi.get.mockResolvedValue({ data: mockSearchResponse });

      const result = await documentNodeSearchService.search('test');

      const call = mockApi.get.mock.calls[0][0] as string;
      expect(call).toContain('q=test');
      expect(call).toContain('limit=50');
      expect(result).toEqual(mockSearchResponse);
    });

    it('should search with type filter', async () => {
      mockApi.get.mockResolvedValue({ data: mockSearchResponse });

      await documentNodeSearchService.search('test', 20, 'attachment');

      const call = mockApi.get.mock.calls[0][0] as string;
      expect(call).toContain('q=test');
      expect(call).toContain('limit=20');
      expect(call).toContain('type=attachment');
    });
  });

  describe('getSuggestions', () => {
    it('should return empty for short queries', async () => {
      const result = await documentNodeSearchService.getSuggestions('a');

      expect(mockApi.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should fetch suggestions for valid queries', async () => {
      const suggestions = [{ id: 'node-1', title: 'Test Doc' }];
      mockApi.get.mockResolvedValue({ data: suggestions });

      const result = await documentNodeSearchService.getSuggestions('test');

      const call = mockApi.get.mock.calls[0][0] as string;
      expect(call).toContain('q=test');
      expect(result).toEqual(suggestions);
    });
  });

  describe('formatSnippet', () => {
    it('should return snippet as-is if within max length', () => {
      const snippet = 'Short snippet';
      expect(documentNodeSearchService.formatSnippet(snippet)).toBe(snippet);
    });

    it('should truncate long snippets', () => {
      const snippet = 'A'.repeat(300);
      const result = documentNodeSearchService.formatSnippet(snippet, 100);
      expect(result.length).toBe(103); // 100 + '...'
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('getResultIcon', () => {
    it('should return folder icon for folder nodes', () => {
      const result = { type: 'node' as const, metadata: { type: 'FOLDER' } } as any;
      expect(documentNodeSearchService.getResultIcon(result)).toBe('📁');
    });

    it('should return document icon for document nodes', () => {
      const result = { type: 'node' as const, metadata: { type: 'DOCUMENT' } } as any;
      expect(documentNodeSearchService.getResultIcon(result)).toBe('📄');
    });

    it('should return image icon for image attachments', () => {
      const result = { type: 'attachment' as const, metadata: { mimeType: 'image/png' } } as any;
      expect(documentNodeSearchService.getResultIcon(result)).toBe('🖼️');
    });

    it('should return clock icon for versions', () => {
      const result = { type: 'version' as const, metadata: {} } as any;
      expect(documentNodeSearchService.getResultIcon(result)).toBe('🕐');
    });
  });

  describe('getTypeLabel', () => {
    it('should return Ordner for folders', () => {
      const result = { type: 'node' as const, metadata: { type: 'FOLDER' } } as any;
      expect(documentNodeSearchService.getTypeLabel(result)).toBe('Ordner');
    });

    it('should return Dokument for documents', () => {
      const result = { type: 'node' as const, metadata: { type: 'DOCUMENT' } } as any;
      expect(documentNodeSearchService.getTypeLabel(result)).toBe('Dokument');
    });

    it('should return Anhang for attachments', () => {
      const result = { type: 'attachment' as const, metadata: {} } as any;
      expect(documentNodeSearchService.getTypeLabel(result)).toBe('Anhang');
    });
  });
});
