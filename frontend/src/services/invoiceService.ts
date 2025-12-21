import api from './api';
import { Invoice, InvoiceStatus } from '../types';

export const getAllInvoices = async (
  search?: string,
  status?: InvoiceStatus,
  customerId?: string,
  isActive?: boolean
): Promise<Invoice[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (customerId) params.append('customerId', customerId);
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  
  const response = await api.get(`/invoices?${params.toString()}`);
  return response.data;
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data: Partial<Invoice>): Promise<Invoice> => {
  const response = await api.post('/invoices', data);
  return response.data;
};

export const updateInvoice = async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
  const response = await api.put(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};

export const getNextInvoiceNumber = async (): Promise<string> => {
  const response = await api.get('/invoices/next-number');
  return response.data.invoiceNumber;
};
