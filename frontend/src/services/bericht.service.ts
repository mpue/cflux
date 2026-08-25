import api, { getBackendURL } from './api';
import { Bericht, BerichtListItem, BerichtProject, BerichtPhoto } from '../types/bericht';

/**
 * Modul "Berichte" (Toolbox-Rundgang / Tagesprotokoll).
 * Alle Endpunkte sind projektgebunden — das Backend liefert nur Berichte zu
 * Projekten, denen der angemeldete Benutzer zugeordnet ist.
 */
export const berichtService = {
  /** Projekte, denen der Benutzer zugeordnet ist (Auswahl beim Anlegen). */
  getProjects: async (): Promise<BerichtProject[]> => {
    const response = await api.get('/berichte/projects');
    return response.data;
  },

  list: async (projectId?: string): Promise<BerichtListItem[]> => {
    const response = await api.get('/berichte', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getById: async (id: string): Promise<Bericht> => {
    const response = await api.get(`/berichte/${id}`);
    return response.data;
  },

  create: async (data: {
    projectId: string;
    weekday: string;
    date: string;
    referent?: string;
  }): Promise<Bericht> => {
    const response = await api.post('/berichte', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Bericht>): Promise<Bericht> => {
    const response = await api.put(`/berichte/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/berichte/${id}`);
  },

  uploadPhotos: async (id: string, files: File[]): Promise<BerichtPhoto[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file, file.name));

    const response = await api.post(`/berichte/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deletePhoto: async (id: string, photoId: string): Promise<void> => {
    await api.delete(`/berichte/${id}/photos/${photoId}`);
  },

  /**
   * URL für <img>-Tags. Das Token wird als Query-Parameter mitgegeben, weil
   * Bild-Tags keine Authorization-Header senden können.
   */
  photoUrl: (id: string, photoId: string): string => {
    const token = localStorage.getItem('token') || '';
    const base = getBackendURL();
    return `${base}/api/berichte/${id}/photos/${photoId}?token=${encodeURIComponent(token)}`;
  },

  /** Lädt den Export als Blob und stößt den Download an. */
  download: async (id: string, format: 'pdf' | 'html'): Promise<void> => {
    const response = await api.get(`/berichte/${id}/export.${format}`, {
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `bericht.${format}`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default berichtService;
