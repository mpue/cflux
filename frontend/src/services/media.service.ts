import api from './api';

export type MediaType = 'IMAGE' | 'PDF' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'ARCHIVE' | 'EXECUTABLE' | 'OTHER';

export interface Media {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  mediaType: MediaType;
  path: string;
  url?: string;
  description?: string;
  tags: string[];
  width?: number;
  height?: number;
  duration?: number;
  isPublic: boolean;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface MediaFilters {
  mediaType?: MediaType;
  isPublic?: boolean;
  search?: string;
  tags?: string;
}

export interface UploadMediaData {
  description?: string;
  tags?: string;
  isPublic?: boolean;
}

export interface UpdateMediaData {
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface MediaStatistics {
  total: number;
  byType: Record<string, number>;
  totalSize: number;
  public: number;
  private: number;
}

class MediaService {
  async getAllMedia(filters?: MediaFilters): Promise<Media[]> {
    const params = new URLSearchParams();
    if (filters?.mediaType) params.append('mediaType', filters.mediaType);
    if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tags) params.append('tags', filters.tags);

    const response = await api.get<Media[]>(`/media?${params.toString()}`);
    return response.data;
  }

  async getMediaById(id: string): Promise<Media> {
    const response = await api.get<Media>(`/media/${id}`);
    return response.data;
  }

  async uploadMedia(file: File, data: UploadMediaData): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);
    if (data.description) formData.append('description', data.description);
    if (data.tags) formData.append('tags', data.tags);
    if (data.isPublic !== undefined) formData.append('isPublic', String(data.isPublic));

    const response = await api.post<Media>('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateMedia(id: string, data: UpdateMediaData): Promise<Media> {
    const response = await api.put<Media>(`/media/${id}`, data);
    return response.data;
  }

  async deleteMedia(id: string): Promise<void> {
    await api.delete(`/media/${id}`);
  }

  async downloadMedia(id: string): Promise<void> {
    const response = await api.get(`/media/${id}/download`, {
      responseType: 'blob',
    });
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async getMediaByTag(tag: string): Promise<Media[]> {
    const response = await api.get<Media[]>(`/media/tags/${tag}`);
    return response.data;
  }

  async getStatistics(): Promise<MediaStatistics> {
    const response = await api.get<MediaStatistics>('/media/statistics');
    return response.data;
  }
}

export const mediaService = new MediaService();
