import api from './api';
import { Customer } from '../types';

export const getAllCustomers = async (search?: string, isActive?: boolean): Promise<Customer[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  
  const response = await api.get(`/customers?${params.toString()}`);
  return response.data;
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
  const response = await api.post('/customers', customerData);
  return response.data;
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
  const response = await api.put(`/customers/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}`);
};
