import api from './api';

export interface DocumentNodeAttachment {
  id: string;
  documentNodeId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  path: string;
  pdfPath?: string;
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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
}

export interface AttachmentVersion {
  id: string;
  attachmentId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  path: string;
  version: number;
  changeReason?: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

class DocumentNodeAttachmentService {
  /**
   * Get all attachments for a document node
   */
  async getNodeAttachments(nodeId: string): Promise<DocumentNodeAttachment[]> {
    const response = await api.get(`/document-nodes/${nodeId}/attachments`);
    return response.data;
  }

  /**
   * Upload a new attachment
   */
  async uploadAttachment(
    nodeId: string,
    file: File,
    description?: string
  ): Promise<DocumentNodeAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post(
      `/document-nodes/${nodeId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Update an existing attachment (creates new version)
   */
  async updateAttachment(
    attachmentId: string,
    file: File,
    description?: string,
    changeReason?: string
  ): Promise<DocumentNodeAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    if (changeReason) {
      formData.append('changeReason', changeReason);
    }

    const response = await api.put(
      `/document-nodes/attachments/${attachmentId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Update attachment metadata only (no file change, no new version)
   */
  async updateAttachmentMetadata(
    attachmentId: string,
    description: string
  ): Promise<DocumentNodeAttachment> {
    const response = await api.patch(
      `/document-nodes/attachments/${attachmentId}/metadata`,
      { description }
    );
    return response.data;
  }

  /**
   * Delete an attachment (soft delete)
   */
  async deleteAttachment(attachmentId: string): Promise<{ message: string }> {
    const response = await api.delete(`/document-nodes/attachments/${attachmentId}`);
    return response.data;
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(attachmentId: string, filename: string): Promise<void> {
    const response = await api.get(
      `/document-nodes/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      }
    );

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

  /**
   * Get version history of an attachment
   */
  async getAttachmentVersions(attachmentId: string): Promise<AttachmentVersion[]> {
    const response = await api.get(`/document-nodes/attachments/${attachmentId}/versions`);
    return response.data;
  }

  /**
   * Download a specific version of an attachment
   */
  async downloadAttachmentVersion(versionId: string, filename: string): Promise<void> {
    const response = await api.get(
      `/document-nodes/attachments/versions/${versionId}/download`,
      {
        responseType: 'blob',
      }
    );

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

  /**
   * Get the direct download URL for an attachment (for links)
   */
  getDownloadUrl(attachmentId: string): string {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/document-nodes/attachments/${attachmentId}/download`;
  }

  /**
   * Get the PDF preview URL for an attachment (for inline viewing)
   */
  getPdfPreviewUrl(attachmentId: string): string {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/document-nodes/attachments/${attachmentId}/pdf`;
  }

  /**
   * Download the PDF preview of an attachment
   */
  async downloadPdf(attachmentId: string, filename: string): Promise<void> {
    const response = await api.get(
      `/document-nodes/attachments/${attachmentId}/pdf`,
      {
        responseType: 'blob',
      }
    );

    const pdfFilename = filename.replace(/\.[^.]+$/, '.pdf');
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', pdfFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Open the PDF preview in a new browser tab
   */
  async openPdfPreview(attachmentId: string): Promise<void> {
    const response = await api.get(
      `/document-nodes/attachments/${attachmentId}/pdf`,
      {
        responseType: 'blob',
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(url, '_blank');
  }

  /**
   * Check if an attachment has a PDF preview available
   */
  hasPdfPreview(attachment: DocumentNodeAttachment): boolean {
    return !!attachment.pdfPath || this.isPdf(attachment.originalFilename);
  }

  /**
   * Check if a file is a PDF
   */
  isPdf(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('text/')) return '📃';
    return '📎';
  }
}

export const documentNodeAttachmentService = new DocumentNodeAttachmentService();
export default documentNodeAttachmentService;
