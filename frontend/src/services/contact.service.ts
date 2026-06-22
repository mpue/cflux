import api from './api';

export interface ContactGroupRef {
  id: string;
  name: string;
  color?: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  visibleToGroups?: ContactGroupRef[];
  _count?: {
    contacts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  category?: string;
  notes?: string;
  isActive: boolean;
  contactGroupId?: string;
  employeeId?: string;
  contactGroup?: {
    id: string;
    name: string;
    color?: string;
    visibleToGroups?: ContactGroupRef[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactGroupDto {
  name: string;
  description?: string;
  color?: string;
  userGroupIds?: string[];
}

export interface UpdateContactGroupDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  userGroupIds?: string[];
}

class ContactService {
  async getAllContacts(): Promise<Contact[]> {
    const response = await api.get('/contacts');
    return response.data;
  }

  async getContactById(id: string): Promise<Contact> {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  }

  async createContact(contact: Partial<Contact>): Promise<Contact> {
    const response = await api.post('/contacts', contact);
    return response.data;
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const response = await api.put(`/contacts/${id}`, contact);
    return response.data;
  }

  async deleteContact(id: string): Promise<void> {
    await api.delete(`/contacts/${id}`);
  }

  // ===== Kontaktgruppen =====
  async getAllContactGroups(): Promise<ContactGroup[]> {
    const response = await api.get('/contacts/groups');
    return response.data;
  }

  async createContactGroup(data: CreateContactGroupDto): Promise<ContactGroup> {
    const response = await api.post('/contacts/groups', data);
    return response.data;
  }

  async updateContactGroup(id: string, data: UpdateContactGroupDto): Promise<ContactGroup> {
    const response = await api.put(`/contacts/groups/${id}`, data);
    return response.data;
  }

  async deleteContactGroup(id: string): Promise<void> {
    await api.delete(`/contacts/groups/${id}`);
  }

  // ===== Mitarbeiter-Synchronisation (Mitarbeiter -> Kontakte) =====
  async syncEmployees(contactGroupId: string): Promise<{
    message: string;
    result: { created: number; updated: number; skipped: number };
  }> {
    const response = await api.post('/contacts/sync-employees', { contactGroupId });
    return response.data;
  }
}

export const contactService = new ContactService();
