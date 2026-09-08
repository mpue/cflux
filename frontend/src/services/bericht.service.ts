import api, { getBackendURL } from './api';
import {
  Bericht,
  BerichtDashboard,
  BerichtFolder,
  BerichtImportResult,
  BerichtListItem,
  BerichtProject,
  BerichtPhoto,
} from '../types/bericht';

/**
 * Modul "Berichte" (Toolbox-Rundgang / Tagesprotokoll).
 * Alle Endpunkte sind projektgebunden — das Backend liefert nur Berichte zu
 * Projekten, denen der angemeldete Benutzer zugeordnet ist.
 */
export interface EhsExportOptions {
  year: number;
  month: number;
  projectId?: string | null;
}

/**
 * Holt einen Export als Blob und stösst den Download an. Der Dateiname kommt
 * aus Content-Disposition, damit Backend und Download denselben Namen tragen.
 */
const downloadExport = async (
  path: string,
  fallbackName: string,
  ehs?: EhsExportOptions
): Promise<void> => {
  const response = await api.get(path, {
    responseType: 'blob',
    params: ehs
      ? {
          ehs: 'true',
          ehsYear: ehs.year,
          ehsMonth: ehs.month,
          ehsProjectId: ehs.projectId || 'all',
        }
      : undefined,
    // Ein Gesamt-Wochenbericht bringt alle Fotos einer Woche mit.
    timeout: 5 * 60 * 1000,
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = match ? match[1] : fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const berichtService = {
  /** Projekte, denen der Benutzer zugeordnet ist (Auswahl beim Anlegen). */
  getProjects: async (): Promise<BerichtProject[]> => {
    const response = await api.get('/berichte/projects');
    return response.data;
  },

  /** Jahresauswertung über die Feststellungen aller Rundgangsberichte. */
  getDashboard: async (year: number, projectId?: string | null): Promise<BerichtDashboard> => {
    const response = await api.get('/berichte/dashboard', {
      params: { year, projectId: projectId || 'all' },
    });
    return response.data;
  },

  // --- Ordner ---

  listFolders: async (projectId?: string): Promise<BerichtFolder[]> => {
    const response = await api.get('/berichte/folders', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  createFolder: async (projectId: string, name: string): Promise<BerichtFolder> => {
    const response = await api.post('/berichte/folders', { projectId, name });
    return response.data;
  },

  renameFolder: async (id: string, name: string): Promise<BerichtFolder> => {
    const response = await api.put(`/berichte/folders/${id}`, { name });
    return response.data;
  },

  /** Löscht nur den Ordner — die Berichte darin landen wieder in „Ohne Ordner". */
  deleteFolder: async (id: string): Promise<void> => {
    await api.delete(`/berichte/folders/${id}`);
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

  /**
   * Importiert einen Datenexport (ZIP) aus dem eigenständigen
   * Wochenbericht-Tool in das gewählte Projekt.
   */
  importArchive: async (
    file: File,
    projectId: string,
    skipDuplicates = true,
    onProgress?: (percent: number) => void
  ): Promise<BerichtImportResult> => {
    const formData = new FormData();
    // projectId vor der Datei anhängen: die Zugriffsprüfung im Backend liest
    // das Feld, und so steht es am Anfang des Multipart-Streams.
    formData.append('projectId', projectId);
    formData.append('skipDuplicates', String(skipDuplicates));
    formData.append('archive', file, file.name);

    const response = await api.post('/berichte/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Ein Export mit hunderten Originalfotos ist schnell ueber ein Gigabyte
      // gross — Hochladen und Entpacken dauern entsprechend.
      timeout: 30 * 60 * 1000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data;
  },

  /** Einzelner Bericht; mit `ehs` hängt die EHS-Auswertung hinten an. */
  download: async (
    id: string,
    format: 'pdf' | 'html',
    ehs?: EhsExportOptions
  ): Promise<void> => {
    await downloadExport(`/berichte/${id}/export.${format}`, `bericht.${format}`, ehs);
  },

  /** Datenexport eines einzelnen Tagesblatts, wieder importierbar. */
  downloadArchive: async (id: string): Promise<void> => {
    await downloadExport(`/berichte/${id}/export.zip`, 'bericht-daten.zip');
  },

  /** Gesamt-Wochenbericht: Deckblatt mit Kennzahlen, danach jedes Tagesblatt. */
  downloadFolder: async (
    folderId: string,
    format: 'pdf' | 'html',
    ehs?: EhsExportOptions
  ): Promise<void> => {
    await downloadExport(
      `/berichte/folders/${folderId}/export.${format}`,
      `wochenbericht.${format}`,
      ehs
    );
  },

  /**
   * Datenexport eines Ordners im Austauschformat — dieselbe ZIP-Struktur, die
   * „Daten importieren" wieder einliest. Ohne EHS-Parameter: das Archiv trägt
   * die Rohdaten, keine Auswertung.
   */
  downloadFolderArchive: async (folderId: string): Promise<void> => {
    await downloadExport(`/berichte/folders/${folderId}/export.zip`, 'wochenbericht-daten.zip');
  },
};

export default berichtService;
