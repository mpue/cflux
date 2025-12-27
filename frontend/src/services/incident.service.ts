import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export interface Incident {
  id: string;
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
    assignedToId?: string
  ): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (assignedToId) params.append('assignedToId', assignedToId);

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
};
