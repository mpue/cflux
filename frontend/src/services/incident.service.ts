import axios from 'axios';

// Check if running in Electron and use injected backend URL
const electronBackendUrl = typeof window !== 'undefined' && (window as any).ELECTRON_BACKEND_URL;
const API_URL = electronBackendUrl 
  ? `${electronBackendUrl}/api`
  : (process.env.REACT_APP_API_URL || '/api');

export interface Incident {
  id: string;
  incidentNumber?: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  reportedById: string;
  assignedToId?: string;
  projectId?: string;
  category?: string;
  affectedSystem?: string;
  reportedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  dueDate?: string;
  solution?: string;
  notes?: string;
  tags?: string;
  // EHS fields
  isEHSRelevant?: boolean;
  ehsCategory?: string;
  ehsSeverity?: string;
  incidentDate?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  comments?: IncidentComment[];
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface IncidentAttachment {
  id: string;
  incidentId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateIncidentDto {
  title: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedToId?: string;
  projectId?: string;
  category?: string;
  affectedSystem?: string;
  dueDate?: string;
  tags?: string[];
  // EHS fields
  isEHSRelevant?: boolean;
  ehsCategory?: string;
  ehsSeverity?: string;
  incidentDate?: string;
  location?: string;
}

export interface UpdateIncidentDto {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToId?: string;
  projectId?: string;
  category?: string;
  affectedSystem?: string;
  dueDate?: string;
  solution?: string;
  notes?: string;
  tags?: string[];
  // EHS fields
  isEHSRelevant?: boolean;
  ehsCategory?: string;
  ehsSeverity?: string;
  incidentDate?: string;
  location?: string;
}

export interface IncidentStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
  high: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const incidentService = {
  async getAll(
    status?: string,
    priority?: string,
    assignedToId?: string,
    projectId?: string
  ): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (assignedToId) params.append('assignedToId', assignedToId);
    if (projectId) params.append('projectId', projectId);

    const response = await axios.get(`${API_URL}/incidents?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getById(id: string): Promise<Incident> {
    const response = await axios.get(`${API_URL}/incidents/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async create(data: CreateIncidentDto): Promise<Incident> {
    const response = await axios.post(`${API_URL}/incidents`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async update(id: string, data: UpdateIncidentDto): Promise<Incident> {
    const response = await axios.put(`${API_URL}/incidents/${id}`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/incidents/${id}`, {
      headers: getAuthHeader(),
    });
  },

  async addComment(id: string, comment: string): Promise<IncidentComment> {
    const response = await axios.post(
      `${API_URL}/incidents/${id}/comments`,
      { comment },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  async getComments(id: string): Promise<IncidentComment[]> {
    const response = await axios.get(`${API_URL}/incidents/${id}/comments`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getStatistics(): Promise<IncidentStatistics> {
    const response = await axios.get(`${API_URL}/incidents/statistics`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async reorder(orderedIds: string[]): Promise<void> {
    await axios.put(`${API_URL}/incidents/reorder`, { orderedIds }, {
      headers: getAuthHeader(),
    });
  },

  async getAttachments(incidentId: string): Promise<IncidentAttachment[]> {
    const response = await axios.get(`${API_URL}/incidents/${incidentId}/attachments`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async uploadAttachment(incidentId: string, file: File): Promise<IncidentAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/incidents/${incidentId}/attachments`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAttachmentDownloadUrl(attachmentId: string): string {
    return `${API_URL}/incidents/attachments/${attachmentId}/download`;
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    await axios.delete(`${API_URL}/incidents/attachments/${attachmentId}`, {
      headers: getAuthHeader(),
    });
  },

  async exportCSV(status?: string, priority?: string, projectId?: string): Promise<void> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (projectId) params.append('projectId', projectId);

    const response = await axios.get(`${API_URL}/incidents/export/csv?${params.toString()}`, {
      headers: getAuthHeader(),
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '') ?? 'incidents.csv'
      : 'incidents.csv';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Lädt den hochwertigen Vorfallbericht (PDF) für die Geschäftsleitung.
   * Öffnet das PDF standardmäßig in einem neuen Tab (Vorschau/Drucken);
   * mit download=true wird es direkt heruntergeladen.
   */
  async exportPDF(incidentId: string, options?: { download?: boolean }): Promise<void> {
    const download = options?.download ?? false;
    const response = await axios.get(
      `${API_URL}/incidents/${incidentId}/pdf${download ? '?download=true' : ''}`,
      {
        headers: getAuthHeader(),
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '') ?? 'Vorfallbericht.pdf'
      : 'Vorfallbericht.pdf';

    if (download) {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      window.open(url, '_blank');
    }

    // Object-URL nach kurzer Zeit freigeben (Tab/Direktdownload hat dann geladen)
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  },

  /**
   * Lädt den Gesamtbericht (Management-Übersicht über alle Vorfälle) als PDF.
   * Berücksichtigt die gleichen Filter wie der CSV-Export.
   */
  async exportSummaryPDF(
    filters?: { status?: string; priority?: string; projectId?: string; year?: number },
    options?: { download?: boolean }
  ): Promise<void> {
    const download = options?.download ?? false;
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.year) params.append('year', String(filters.year));
    if (download) params.append('download', 'true');

    const response = await axios.get(`${API_URL}/incidents/export/pdf?${params.toString()}`, {
      headers: getAuthHeader(),
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '') ?? 'Vorfallbericht_Gesamtuebersicht.pdf'
      : 'Vorfallbericht_Gesamtuebersicht.pdf';

    if (download) {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      window.open(url, '_blank');
    }

    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  },
};
