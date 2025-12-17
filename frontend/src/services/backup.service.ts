import api from './api';

export interface Backup {
  filename: string;
  size: number;
  created: string;
  modified: string;
}

export interface BackupResponse {
  message: string;
  filename: string;
  timestamp: string;
  size: number;
}

export const backupService = {
  // Create a new backup
  createBackup: async (): Promise<BackupResponse> => {
    const response = await api.post('/backup/create');
    return response.data;
  },

  // List all backups
  listBackups: async (): Promise<Backup[]> => {
    const response = await api.get('/backup/list');
    return response.data;
  },

  // Download a backup
  downloadBackup: async (filename: string): Promise<void> => {
    const response = await api.get(`/backup/download/${filename}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Delete a backup
  deleteBackup: async (filename: string): Promise<{ message: string }> => {
    const response = await api.delete(`/backup/${filename}`);
    return response.data;
  },

  // Restore a backup
  restoreBackup: async (filename: string): Promise<{ message: string }> => {
    const response = await api.post(`/backup/restore/${filename}`);
    return response.data;
  },

  // Upload a backup
  uploadBackup: async (file: File): Promise<BackupResponse> => {
    const formData = new FormData();
    formData.append('backup', file);
    
    const response = await api.post('/backup/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Export data as JSON
  exportData: async (): Promise<void> => {
    const response = await api.get('/backup/export', {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `data_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
