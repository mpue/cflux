import axios from 'axios';
import { InvoiceTemplate, InvoiceTemplateFormData } from '../types/invoiceTemplate';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const invoiceTemplateService = {
  // Get all templates
  getAll: async (): Promise<InvoiceTemplate[]> => {
    const response = await api.get('/api/invoice-templates');
    return response.data;
  },

  // Get template by ID
  getById: async (id: string): Promise<InvoiceTemplate> => {
    const response = await api.get(`/api/invoice-templates/${id}`);
    return response.data;
  },

  // Get default template
  getDefault: async (): Promise<InvoiceTemplate> => {
    const response = await api.get('/api/invoice-templates/default');
    return response.data;
  },

  // Create template
  create: async (data: InvoiceTemplateFormData): Promise<InvoiceTemplate> => {
    const response = await api.post('/api/invoice-templates', data);
    return response.data;
  },

  // Update template
  update: async (id: string, data: Partial<InvoiceTemplateFormData>): Promise<InvoiceTemplate> => {
    const response = await api.put(`/api/invoice-templates/${id}`, data);
    return response.data;
  },

  // Delete template
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/invoice-templates/${id}`);
  },

  // Set template as default
  setDefault: async (id: string): Promise<InvoiceTemplate> => {
    const response = await api.put(`/api/invoice-templates/${id}/set-default`);
    return response.data;
  },
};
