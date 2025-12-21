import api from './api';
import { Supplier } from '../types';

export const getAllSuppliers = async (search?: string, isActive?: boolean): Promise<Supplier[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  
  const response = await api.get(`/suppliers?${params.toString()}`);
  return response.data;
};

export const getSupplierById = async (id: string): Promise<Supplier> => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data;
};

export const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
  const response = await api.post('/suppliers', supplierData);
  return response.data;
};

export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier> => {
  const response = await api.put(`/suppliers/${id}`, supplierData);
  return response.data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await api.delete(`/suppliers/${id}`);
};
