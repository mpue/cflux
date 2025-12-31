import api from './api';
import { InvoiceTemplate, InvoiceTemplateFormData } from '../types/invoiceTemplate';

export const invoiceTemplateService = {
  // Get all templates
  getAll: async (): Promise<InvoiceTemplate[]> => {
    const response = await api.get('/invoice-templates');
    return response.data;
  },

  // Get template by ID
  getById: async (id: string): Promise<InvoiceTemplate> => {
    const response = await api.get(`/invoice-templates/${id}`);
    return response.data;
  },

  // Get default template
  getDefault: async (): Promise<InvoiceTemplate> => {
    const response = await api.get('/invoice-templates/default');
    return response.data;
  },

  // Create template
  create: async (data: InvoiceTemplateFormData): Promise<InvoiceTemplate> => {
    const response = await api.post('/invoice-templates', data);
    return response.data;
  },

  // Update template
  update: async (id: string, data: Partial<InvoiceTemplateFormData>): Promise<InvoiceTemplate> => {
    const response = await api.put(`/invoice-templates/${id}`, data);
    return response.data;
  },

  // Delete template
  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoice-templates/${id}`);
  },

  // Set template as default
  setDefault: async (id: string): Promise<InvoiceTemplate> => {
    const response = await api.put(`/invoice-templates/${id}/set-default`);
    return response.data;
  },
};
