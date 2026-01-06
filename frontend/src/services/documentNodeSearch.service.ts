import api from './api';

export interface SearchResult {
  id: string;
  type: 'node' | 'attachment' | 'version';
  nodeId: string;
  title: string;
  snippet: string;
  path: string[];
  relevance: number;
  metadata: {
    type?: string;
    createdAt: string;
    updatedAt: string;
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

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export interface SearchSuggestion {
  id: string;
  title: string;
}

class DocumentNodeSearchService {
  /**
   * Search across document nodes, attachments, and versions
   */
  async search(
    query: string,
    limit: number = 50,
    type?: 'node' | 'attachment' | 'version'
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    if (type) {
      params.append('type', type);
    }

    const response = await api.get(`/document-nodes/search?${params}`);
    return response.data;
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (query.length < 2) {
      return [];
    }

    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    const response = await api.get(`/document-nodes/search/suggestions?${params}`);
    return response.data;
  }

  /**
   * Format snippet text (remove markdown bold markers and limit length)
   */
  formatSnippet(snippet: string, maxLength: number = 200): string {
    // Keep the bold markers for now (will be rendered in UI)
    if (snippet.length <= maxLength) {
      return snippet;
    }
    return snippet.substring(0, maxLength) + '...';
  }

  /**
   * Get icon for search result type
   */
  getResultIcon(result: SearchResult): string {
    if (result.type === 'node') {
      return result.metadata.type === 'FOLDER' ? '📁' : '📄';
    } else if (result.type === 'attachment') {
      const mimeType = result.metadata.mimeType || '';
      if (mimeType.startsWith('image/')) return '🖼️';
      if (mimeType === 'application/pdf') return '📄';
      if (mimeType.includes('word')) return '📝';
      if (mimeType.includes('excel')) return '📊';
      if (mimeType.includes('powerpoint')) return '📽️';
      if (mimeType.includes('zip')) return '📦';
      return '📎';
    } else {
      return '🕐'; // version
    }
  }

  /**
   * Get human-readable type label
   */
  getTypeLabel(result: SearchResult): string {
    if (result.type === 'node') {
      return result.metadata.type === 'FOLDER' ? 'Ordner' : 'Dokument';
    } else if (result.type === 'attachment') {
      return 'Anhang';
    } else {
      return `Version ${result.metadata.version}`;
    }
  }

  /**
   * Format file size (for attachments)
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Highlight search term in text (converts **term** to <mark>term</mark>)
   */
  highlightText(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<mark>$1</mark>');
  }
}

export const documentNodeSearchService = new DocumentNodeSearchService();
export default documentNodeSearchService;
