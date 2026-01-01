import * as customerService from '../customerService';
import api from '../api';
import { Customer } from '../../types';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Customer Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createCustomer', () => {
    it('should create customer with all fields', async () => {
      const newCustomerData: Partial<Customer> = {
        name: 'Acme Corporation',
        contactPerson: 'John Doe',
        email: 'contact@acme.com',
        phone: '+41 44 123 45 67',
        address: 'Bahnhofstrasse 1',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Switzerland',
        taxId: 'CHE-123.456.789',
        notes: 'Important client',
        isActive: true,
      };

      const mockCreatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Acme Corporation',
        contactPerson: 'John Doe',
        email: 'contact@acme.com',
        phone: '+41 44 123 45 67',
        address: 'Bahnhofstrasse 1',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Switzerland',
        taxId: 'CHE-123.456.789',
        notes: 'Important client',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockCreatedCustomer,
      });

      const result = await customerService.createCustomer(newCustomerData);

      expect(mockedApi.post).toHaveBeenCalledWith('/customers', newCustomerData);
      expect(result).toEqual(mockCreatedCustomer);
      expect(result.id).toBe('customer-123');
      expect(result.name).toBe('Acme Corporation');
      expect(result.email).toBe('contact@acme.com');
      expect(result.taxId).toBe('CHE-123.456.789');
    });

    it('should create customer with minimal required fields', async () => {
      const minimalData: Partial<Customer> = {
        name: 'Simple Corp',
      };

      const mockCustomer: Customer = {
        id: 'customer-456',
        name: 'Simple Corp',
        isActive: true,
        createdAt: '2026-01-01T10:30:00Z',
        updatedAt: '2026-01-01T10:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(minimalData);

      expect(result.name).toBe('Simple Corp');
      expect(result.isActive).toBe(true);
      expect(result.contactPerson).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should create inactive customer', async () => {
      const inactiveCustomer: Partial<Customer> = {
        name: 'Former Client Ltd',
        email: 'info@formerclient.com',
        isActive: false,
      };

      const mockCustomer: Customer = {
        id: 'customer-789',
        name: 'Former Client Ltd',
        email: 'info@formerclient.com',
        isActive: false,
        createdAt: '2026-01-01T11:00:00Z',
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(inactiveCustomer);

      expect(result.isActive).toBe(false);
      expect(result.name).toBe('Former Client Ltd');
    });

    it('should create customer with Swiss address', async () => {
      const swissCustomer: Partial<Customer> = {
        name: 'Schweizer AG',
        address: 'Paradeplatz 8',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
        taxId: 'CHE-987.654.321',
      };

      const mockCustomer: Customer = {
        id: 'customer-swiss',
        ...swissCustomer as Customer,
        isActive: true,
        createdAt: '2026-01-01T11:30:00Z',
        updatedAt: '2026-01-01T11:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(swissCustomer);

      expect(result.city).toBe('Zürich');
      expect(result.country).toBe('Schweiz');
      expect(result.taxId).toBe('CHE-987.654.321');
    });

    it('should create customer with international address', async () => {
      const internationalCustomer: Partial<Customer> = {
        name: 'Global Tech Inc',
        address: '123 Main Street',
        zipCode: '10001',
        city: 'New York',
        country: 'USA',
        phone: '+1 212 555 0123',
      };

      const mockCustomer: Customer = {
        id: 'customer-intl',
        ...internationalCustomer as Customer,
        isActive: true,
        createdAt: '2026-01-01T12:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(internationalCustomer);

      expect(result.country).toBe('USA');
      expect(result.phone).toBe('+1 212 555 0123');
    });

    it('should handle creation error', async () => {
      const customerData: Partial<Customer> = {
        name: 'Test Customer',
        email: 'duplicate@example.com',
      };

      mockedApi.post.mockRejectedValue(new Error('Customer with this email already exists'));

      await expect(customerService.createCustomer(customerData))
        .rejects.toThrow('Customer with this email already exists');
    });

    it('should create customer with special characters in name', async () => {
      const customerData: Partial<Customer> = {
        name: 'Müller & Söhne GmbH',
        contactPerson: 'François Dubois',
        city: 'Genève',
      };

      const mockCustomer: Customer = {
        id: 'customer-special',
        ...customerData as Customer,
        isActive: true,
        createdAt: '2026-01-01T12:30:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(customerData);

      expect(result.name).toBe('Müller & Söhne GmbH');
      expect(result.contactPerson).toBe('François Dubois');
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllCustomers', () => {
    it('should get all customers without filters', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Customer A',
          email: 'a@example.com',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'customer-2',
          name: 'Customer B',
          email: 'b@example.com',
          isActive: true,
          createdAt: '2026-01-01T10:30:00Z',
          updatedAt: '2026-01-01T10:30:00Z',
        },
        {
          id: 'customer-3',
          name: 'Customer C',
          isActive: false,
          createdAt: '2026-01-01T11:00:00Z',
          updatedAt: '2026-01-01T11:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerService.getAllCustomers();

      expect(mockedApi.get).toHaveBeenCalledWith('/customers?');
      expect(result).toEqual(mockCustomers);
      expect(result).toHaveLength(3);
    });

    it('should get customers with search filter', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Acme Corporation',
          email: 'info@acme.com',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerService.getAllCustomers('Acme');

      expect(mockedApi.get).toHaveBeenCalledWith('/customers?search=Acme');
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Acme');
    });

    it('should search customers by email', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Test Company',
          email: 'test@acme.com',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerService.getAllCustomers('test@acme');

      expect(mockedApi.get).toHaveBeenCalledWith('/customers?search=test%40acme');
      expect(result[0].email).toContain('test@acme');
    });

    it('should get only active customers', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Active Customer 1',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'customer-2',
          name: 'Active Customer 2',
          isActive: true,
          createdAt: '2026-01-01T10:30:00Z',
          updatedAt: '2026-01-01T10:30:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerService.getAllCustomers(undefined, true);

      expect(mockedApi.get).toHaveBeenCalledWith('/customers?isActive=true');
      expect(result.every(customer => customer.isActive)).toBe(true);
    });

    it('should get only inactive customers', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Inactive Customer',
          isActive: false,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerService.getAllCustomers(undefined, false);

      expect(mockedApi.get).toHaveBeenCalledWith('/customers?isActive=false');
      expect(result.every(customer => !customer.isActive)).toBe(true);
    });

    it('should get customers with combined filters', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Active Acme',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerService.getAllCustomers('Acme', true);

      expect(mockedApi.get).toHaveBeenCalledWith('/customers?search=Acme&isActive=true');
      expect(result[0].isActive).toBe(true);
      expect(result[0].name).toContain('Acme');
    });

    it('should return empty array when no customers found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await customerService.getAllCustomers('nonexistent');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should get customers with projects relation', async () => {
      const mockCustomers: Customer[] = [
        {
          id: 'customer-1',
          name: 'Customer with Projects',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
          projects: [
            {
              id: 'project-1',
              name: 'Project A',
              customerId: 'customer-1',
              startDate: '2026-01-01',
              isActive: true,
              createdAt: '2026-01-01T10:05:00Z',
              updatedAt: '2026-01-01T10:05:00Z',
            },
          ],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockCustomers });

      const result = await customerService.getAllCustomers();

      expect(result[0].projects).toBeDefined();
      expect(result[0].projects).toHaveLength(1);
    });
  });

  describe('READ - getCustomerById', () => {
    it('should get customer by id', async () => {
      const mockCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Customer',
        contactPerson: 'John Doe',
        email: 'test@example.com',
        phone: '+41 44 123 45 67',
        address: 'Test Street 1',
        zipCode: '8000',
        city: 'Zürich',
        country: 'Switzerland',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.getCustomerById('customer-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/customers/customer-123');
      expect(result).toEqual(mockCustomer);
      expect(result.id).toBe('customer-123');
    });

    it('should get customer with all optional fields', async () => {
      const mockCustomer: Customer = {
        id: 'customer-full',
        name: 'Complete Customer',
        contactPerson: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+41 44 999 88 77',
        address: 'Complete Street 99',
        zipCode: '8050',
        city: 'Zürich',
        country: 'Switzerland',
        taxId: 'CHE-111.222.333',
        notes: 'VIP customer with special requirements',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.getCustomerById('customer-full');

      expect(result.contactPerson).toBe('Jane Smith');
      expect(result.taxId).toBe('CHE-111.222.333');
      expect(result.notes).toBe('VIP customer with special requirements');
    });

    it('should get customer with projects', async () => {
      const mockCustomer: Customer = {
        id: 'customer-123',
        name: 'Customer with Projects',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        projects: [
          {
            id: 'project-1',
            name: 'Project Alpha',
            customerId: 'customer-123',
            startDate: '2026-01-01',
            isActive: true,
            createdAt: '2026-01-01T10:05:00Z',
            updatedAt: '2026-01-01T10:05:00Z',
          },
          {
            id: 'project-2',
            name: 'Project Beta',
            customerId: 'customer-123',
            startDate: '2026-01-15',
            isActive: true,
            createdAt: '2026-01-01T10:10:00Z',
            updatedAt: '2026-01-01T10:10:00Z',
          },
        ],
      };

      mockedApi.get.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.getCustomerById('customer-123');

      expect(result.projects).toBeDefined();
      expect(result.projects).toHaveLength(2);
      expect(result.projects?.[0].name).toBe('Project Alpha');
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Customer not found'));

      await expect(customerService.getCustomerById('nonexistent-id'))
        .rejects.toThrow('Customer not found');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateCustomer', () => {
    it('should update customer name', async () => {
      const updates: Partial<Customer> = {
        name: 'Updated Company Name',
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Updated Company Name',
        email: 'old@example.com',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/customers/customer-123', updates);
      expect(result.name).toBe('Updated Company Name');
      expect(result.updatedAt).not.toBe(result.createdAt);
    });

    it('should update contact information', async () => {
      const updates: Partial<Customer> = {
        contactPerson: 'New Contact Person',
        email: 'newemail@example.com',
        phone: '+41 44 999 99 99',
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Company',
        contactPerson: 'New Contact Person',
        email: 'newemail@example.com',
        phone: '+41 44 999 99 99',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result.contactPerson).toBe('New Contact Person');
      expect(result.email).toBe('newemail@example.com');
      expect(result.phone).toBe('+41 44 999 99 99');
    });

    it('should update address information', async () => {
      const updates: Partial<Customer> = {
        address: 'New Street 123',
        zipCode: '8050',
        city: 'Oerlikon',
        country: 'Switzerland',
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Company',
        address: 'New Street 123',
        zipCode: '8050',
        city: 'Oerlikon',
        country: 'Switzerland',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result.address).toBe('New Street 123');
      expect(result.city).toBe('Oerlikon');
    });

    it('should update tax ID', async () => {
      const updates: Partial<Customer> = {
        taxId: 'CHE-999.888.777',
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Company',
        taxId: 'CHE-999.888.777',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result.taxId).toBe('CHE-999.888.777');
    });

    it('should update notes', async () => {
      const updates: Partial<Customer> = {
        notes: 'Updated notes with important information',
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Company',
        notes: 'Updated notes with important information',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result.notes).toBe('Updated notes with important information');
    });

    it('should deactivate customer', async () => {
      const updates: Partial<Customer> = {
        isActive: false,
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Company',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result.isActive).toBe(false);
    });

    it('should reactivate customer', async () => {
      const updates: Partial<Customer> = {
        isActive: true,
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Company',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result.isActive).toBe(true);
    });

    it('should update all fields at once', async () => {
      const updates: Partial<Customer> = {
        name: 'Completely Updated Corp',
        contactPerson: 'Max Mustermann',
        email: 'max@updated.com',
        phone: '+41 44 111 22 33',
        address: 'Neue Strasse 88',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
        taxId: 'CHE-555.444.333',
        notes: 'All fields updated',
        isActive: false,
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Completely Updated Corp',
        contactPerson: 'Max Mustermann',
        email: 'max@updated.com',
        phone: '+41 44 111 22 33',
        address: 'Neue Strasse 88',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
        taxId: 'CHE-555.444.333',
        notes: 'All fields updated',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result).toMatchObject(updates);
    });

    it('should clear optional fields', async () => {
      const updates: Partial<Customer> = {
        contactPerson: undefined,
        notes: undefined,
      };

      const mockUpdatedCustomer: Customer = {
        id: 'customer-123',
        name: 'Test Company',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T16:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedCustomer });

      const result = await customerService.updateCustomer('customer-123', updates);

      expect(result.contactPerson).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should handle update error', async () => {
      const updates: Partial<Customer> = {
        email: 'duplicate@example.com',
      };

      mockedApi.put.mockRejectedValue(new Error('Email already in use'));

      await expect(customerService.updateCustomer('customer-123', updates))
        .rejects.toThrow('Email already in use');
    });

    it('should handle not found error on update', async () => {
      const updates: Partial<Customer> = {
        name: 'Updated Name',
      };

      mockedApi.put.mockRejectedValue(new Error('Customer not found'));

      await expect(customerService.updateCustomer('nonexistent-id', updates))
        .rejects.toThrow('Customer not found');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await customerService.deleteCustomer('customer-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/customers/customer-123');
    });

    it('should delete multiple customers', async () => {
      const customerIds = ['customer-1', 'customer-2', 'customer-3'];

      mockedApi.delete.mockResolvedValue({});

      for (const id of customerIds) {
        await customerService.deleteCustomer(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenCalledWith('/customers/customer-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/customers/customer-2');
      expect(mockedApi.delete).toHaveBeenCalledWith('/customers/customer-3');
    });

    it('should handle delete error when customer not found', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Customer not found'));

      await expect(customerService.deleteCustomer('nonexistent-id'))
        .rejects.toThrow('Customer not found');
    });

    it('should handle delete error when customer has projects', async () => {
      mockedApi.delete.mockRejectedValue(
        new Error('Cannot delete customer: customer has active projects')
      );

      await expect(customerService.deleteCustomer('customer-123'))
        .rejects.toThrow('Cannot delete customer: customer has active projects');
    });

    it('should handle delete error when customer has invoices', async () => {
      mockedApi.delete.mockRejectedValue(
        new Error('Cannot delete customer: customer has invoices')
      );

      await expect(customerService.deleteCustomer('customer-123'))
        .rejects.toThrow('Cannot delete customer: customer has invoices');
    });

    it('should handle network error on delete', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Network error'));

      await expect(customerService.deleteCustomer('customer-123'))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Customer Lifecycle', () => {
    it('should complete full CRUD lifecycle', async () => {
      // CREATE
      const newCustomer: Partial<Customer> = {
        name: 'Lifecycle Test Corp',
        email: 'lifecycle@test.com',
        phone: '+41 44 123 45 67',
        city: 'Zürich',
        isActive: true,
      };

      const createdCustomer: Customer = {
        id: 'customer-lifecycle',
        name: 'Lifecycle Test Corp',
        email: 'lifecycle@test.com',
        phone: '+41 44 123 45 67',
        city: 'Zürich',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdCustomer });
      const created = await customerService.createCustomer(newCustomer);
      expect(created.id).toBe('customer-lifecycle');

      // READ
      mockedApi.get.mockResolvedValue({ data: createdCustomer });
      const fetched = await customerService.getCustomerById('customer-lifecycle');
      expect(fetched.name).toBe('Lifecycle Test Corp');

      // UPDATE
      const updates: Partial<Customer> = {
        name: 'Updated Lifecycle Corp',
        contactPerson: 'New Contact',
      };

      const updatedCustomer: Customer = {
        ...createdCustomer,
        name: 'Updated Lifecycle Corp',
        contactPerson: 'New Contact',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: updatedCustomer });
      const updated = await customerService.updateCustomer('customer-lifecycle', updates);
      expect(updated.name).toBe('Updated Lifecycle Corp');
      expect(updated.contactPerson).toBe('New Contact');

      // DELETE
      mockedApi.delete.mockResolvedValue({});
      await customerService.deleteCustomer('customer-lifecycle');
      expect(mockedApi.delete).toHaveBeenCalledWith('/customers/customer-lifecycle');
    });

    it('should handle customer activation/deactivation lifecycle', async () => {
      // Create active customer
      const newCustomer: Partial<Customer> = {
        name: 'Active Customer',
        isActive: true,
      };

      const createdCustomer: Customer = {
        id: 'customer-active',
        name: 'Active Customer',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdCustomer });
      const created = await customerService.createCustomer(newCustomer);
      expect(created.isActive).toBe(true);

      // Deactivate
      const deactivated: Customer = {
        ...createdCustomer,
        isActive: false,
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: deactivated });
      const updated1 = await customerService.updateCustomer('customer-active', { isActive: false });
      expect(updated1.isActive).toBe(false);

      // Reactivate
      const reactivated: Customer = {
        ...deactivated,
        isActive: true,
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: reactivated });
      const updated2 = await customerService.updateCustomer('customer-active', { isActive: true });
      expect(updated2.isActive).toBe(true);
    });

    it('should handle gradual customer information completion', async () => {
      // Create with minimal info
      const newCustomer: Partial<Customer> = {
        name: 'Gradual Customer',
      };

      const createdCustomer: Customer = {
        id: 'customer-gradual',
        name: 'Gradual Customer',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdCustomer });
      const created = await customerService.createCustomer(newCustomer);
      expect(created.email).toBeUndefined();

      // Add contact info
      const withContact: Customer = {
        ...createdCustomer,
        email: 'contact@gradual.com',
        phone: '+41 44 123 45 67',
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: withContact });
      const updated1 = await customerService.updateCustomer('customer-gradual', {
        email: 'contact@gradual.com',
        phone: '+41 44 123 45 67',
      });
      expect(updated1.email).toBe('contact@gradual.com');

      // Add address
      const withAddress: Customer = {
        ...withContact,
        address: 'Main Street 1',
        zipCode: '8000',
        city: 'Zürich',
        country: 'Switzerland',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: withAddress });
      const updated2 = await customerService.updateCustomer('customer-gradual', {
        address: 'Main Street 1',
        zipCode: '8000',
        city: 'Zürich',
        country: 'Switzerland',
      });
      expect(updated2.address).toBe('Main Street 1');
      expect(updated2.city).toBe('Zürich');
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle customer with minimal Swiss information', async () => {
      const customerData: Partial<Customer> = {
        name: 'Swiss Minimal AG',
        taxId: 'CHE-123.456.789',
      };

      const mockCustomer: Customer = {
        id: 'customer-swiss-min',
        ...customerData as Customer,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(customerData);

      expect(result.taxId).toBe('CHE-123.456.789');
    });

    it('should handle customer with very long name', async () => {
      const longName = 'Very Long Company Name '.repeat(10);
      const customerData: Partial<Customer> = {
        name: longName.substring(0, 255),
      };

      const mockCustomer: Customer = {
        id: 'customer-long-name',
        name: longName.substring(0, 255),
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(customerData);

      expect(result.name.length).toBeLessThanOrEqual(255);
    });

    it('should handle customer with special characters', async () => {
      const customerData: Partial<Customer> = {
        name: 'Café & Restaurant "Chez François"',
        address: 'Rue de l\'Église 12',
        city: 'Genève',
        notes: 'Special pricing: 20% discount @all services',
      };

      const mockCustomer: Customer = {
        id: 'customer-special',
        ...customerData as Customer,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(customerData);

      expect(result.name).toBe('Café & Restaurant "Chez François"');
      expect(result.address).toBe('Rue de l\'Église 12');
    });

    it('should handle customer with international phone formats', async () => {
      const customers = [
        { phone: '+41 44 123 45 67' }, // Swiss
        { phone: '+49 30 12345678' },  // German
        { phone: '+1 555 123 4567' },  // US
        { phone: '+44 20 7123 4567' }, // UK
      ];

      for (const customerData of customers) {
        const mockCustomer: Customer = {
          id: `customer-${customerData.phone}`,
          name: 'Test Company',
          ...customerData,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedApi.post.mockResolvedValue({ data: mockCustomer });

        const result = await customerService.createCustomer({ name: 'Test Company', ...customerData });
        expect(result.phone).toBe(customerData.phone);
      }
    });

    it('should handle customer with very long notes', async () => {
      const longNotes = 'Important information. '.repeat(100);
      const customerData: Partial<Customer> = {
        name: 'Customer with Notes',
        notes: longNotes,
      };

      const mockCustomer: Customer = {
        id: 'customer-notes',
        name: 'Customer with Notes',
        notes: longNotes,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCustomer });

      const result = await customerService.createCustomer(customerData);

      expect(result.notes).toBeDefined();
      expect(result.notes!.length).toBeGreaterThan(1000);
    });

    it('should handle empty optional fields', async () => {
      const customerData: Partial<Customer> = {
        name: 'Minimal Customer',
        email: '',
        phone: '',
      };

      mockedApi.post.mockRejectedValue(new Error('Email and phone cannot be empty strings'));

      await expect(customerService.createCustomer(customerData))
        .rejects.toThrow('Email and phone cannot be empty strings');
    });

    it('should handle invalid email format', async () => {
      const customerData: Partial<Customer> = {
        name: 'Test Customer',
        email: 'invalid-email',
      };

      mockedApi.post.mockRejectedValue(new Error('Invalid email format'));

      await expect(customerService.createCustomer(customerData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
