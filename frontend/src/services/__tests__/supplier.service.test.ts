import * as supplierService from '../supplierService';
import api from '../api';
import { Supplier } from '../../types';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('Supplier Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests
  // ============================================
  describe('CREATE - createSupplier', () => {
    it('should create supplier with all fields', async () => {
      const newSupplierData: Partial<Supplier> = {
        name: 'Office Supplies AG',
        contactPerson: 'Maria Schmidt',
        email: 'info@officesupplies.ch',
        phone: '+41 44 555 66 77',
        address: 'Industriestrasse 45',
        zipCode: '8005',
        city: 'Zürich',
        country: 'Switzerland',
        taxId: 'CHE-456.789.012',
        notes: 'Preferred supplier for office materials',
        isActive: true,
      };

      const mockCreatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Office Supplies AG',
        contactPerson: 'Maria Schmidt',
        email: 'info@officesupplies.ch',
        phone: '+41 44 555 66 77',
        address: 'Industriestrasse 45',
        zipCode: '8005',
        city: 'Zürich',
        country: 'Switzerland',
        taxId: 'CHE-456.789.012',
        notes: 'Preferred supplier for office materials',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({
        data: mockCreatedSupplier,
      });

      const result = await supplierService.createSupplier(newSupplierData);

      expect(mockedApi.post).toHaveBeenCalledWith('/suppliers', newSupplierData);
      expect(result).toEqual(mockCreatedSupplier);
      expect(result.id).toBe('supplier-123');
      expect(result.name).toBe('Office Supplies AG');
      expect(result.email).toBe('info@officesupplies.ch');
      expect(result.taxId).toBe('CHE-456.789.012');
    });

    it('should create supplier with minimal required fields', async () => {
      const minimalData: Partial<Supplier> = {
        name: 'Basic Supplier',
      };

      const mockSupplier: Supplier = {
        id: 'supplier-456',
        name: 'Basic Supplier',
        isActive: true,
        createdAt: '2026-01-01T10:30:00Z',
        updatedAt: '2026-01-01T10:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(minimalData);

      expect(result.name).toBe('Basic Supplier');
      expect(result.isActive).toBe(true);
      expect(result.contactPerson).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should create inactive supplier', async () => {
      const inactiveSupplier: Partial<Supplier> = {
        name: 'Former Supplier GmbH',
        email: 'info@former.com',
        isActive: false,
      };

      const mockSupplier: Supplier = {
        id: 'supplier-789',
        name: 'Former Supplier GmbH',
        email: 'info@former.com',
        isActive: false,
        createdAt: '2026-01-01T11:00:00Z',
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(inactiveSupplier);

      expect(result.isActive).toBe(false);
      expect(result.name).toBe('Former Supplier GmbH');
    });

    it('should create supplier with Swiss address', async () => {
      const swissSupplier: Partial<Supplier> = {
        name: 'Schweizer Lieferant AG',
        address: 'Hauptstrasse 100',
        zipCode: '3000',
        city: 'Bern',
        country: 'Schweiz',
        taxId: 'CHE-111.222.333',
      };

      const mockSupplier: Supplier = {
        id: 'supplier-swiss',
        ...swissSupplier as Supplier,
        isActive: true,
        createdAt: '2026-01-01T11:30:00Z',
        updatedAt: '2026-01-01T11:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(swissSupplier);

      expect(result.city).toBe('Bern');
      expect(result.country).toBe('Schweiz');
      expect(result.taxId).toBe('CHE-111.222.333');
    });

    it('should create supplier with international address', async () => {
      const internationalSupplier: Partial<Supplier> = {
        name: 'Global Parts Ltd',
        address: 'Industrial Park 7',
        zipCode: 'W1A 1AA',
        city: 'London',
        country: 'United Kingdom',
        phone: '+44 20 1234 5678',
      };

      const mockSupplier: Supplier = {
        id: 'supplier-intl',
        ...internationalSupplier as Supplier,
        isActive: true,
        createdAt: '2026-01-01T12:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(internationalSupplier);

      expect(result.country).toBe('United Kingdom');
      expect(result.phone).toBe('+44 20 1234 5678');
    });

    it('should handle creation error', async () => {
      const supplierData: Partial<Supplier> = {
        name: 'Test Supplier',
        email: 'duplicate@example.com',
      };

      mockedApi.post.mockRejectedValue(new Error('Supplier with this email already exists'));

      await expect(supplierService.createSupplier(supplierData))
        .rejects.toThrow('Supplier with this email already exists');
    });

    it('should create supplier with special characters in name', async () => {
      const supplierData: Partial<Supplier> = {
        name: 'Bäckerei & Konditorei Müller',
        contactPerson: 'André Dupont',
        city: 'Lausanne',
      };

      const mockSupplier: Supplier = {
        id: 'supplier-special',
        ...supplierData as Supplier,
        isActive: true,
        createdAt: '2026-01-01T12:30:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(supplierData);

      expect(result.name).toBe('Bäckerei & Konditorei Müller');
      expect(result.contactPerson).toBe('André Dupont');
    });
  });

  // ============================================
  // READ Tests
  // ============================================
  describe('READ - getAllSuppliers', () => {
    it('should get all suppliers without filters', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          name: 'Supplier A',
          email: 'a@example.com',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'supplier-2',
          name: 'Supplier B',
          email: 'b@example.com',
          isActive: true,
          createdAt: '2026-01-01T10:30:00Z',
          updatedAt: '2026-01-01T10:30:00Z',
        },
        {
          id: 'supplier-3',
          name: 'Supplier C',
          isActive: false,
          createdAt: '2026-01-01T11:00:00Z',
          updatedAt: '2026-01-01T11:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockSuppliers });

      const result = await supplierService.getAllSuppliers();

      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers?');
      expect(result).toEqual(mockSuppliers);
      expect(result).toHaveLength(3);
    });

    it('should get suppliers with search filter', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          name: 'Office Supplies AG',
          email: 'info@office.ch',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockSuppliers });

      const result = await supplierService.getAllSuppliers('Office');

      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers?search=Office');
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Office');
    });

    it('should search suppliers by email', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          name: 'Test Supplier',
          email: 'test@supplier.com',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockSuppliers });

      const result = await supplierService.getAllSuppliers('test@supplier');

      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers?search=test%40supplier');
      expect(result[0].email).toContain('test@supplier');
    });

    it('should get only active suppliers', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          name: 'Active Supplier 1',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'supplier-2',
          name: 'Active Supplier 2',
          isActive: true,
          createdAt: '2026-01-01T10:30:00Z',
          updatedAt: '2026-01-01T10:30:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockSuppliers });

      const result = await supplierService.getAllSuppliers(undefined, true);

      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers?isActive=true');
      expect(result.every(supplier => supplier.isActive)).toBe(true);
    });

    it('should get only inactive suppliers', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          name: 'Inactive Supplier',
          isActive: false,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockSuppliers });

      const result = await supplierService.getAllSuppliers(undefined, false);

      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers?isActive=false');
      expect(result.every(supplier => !supplier.isActive)).toBe(true);
    });

    it('should get suppliers with combined filters', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          name: 'Active Office Supplier',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockSuppliers });

      const result = await supplierService.getAllSuppliers('Office', true);

      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers?search=Office&isActive=true');
      expect(result[0].isActive).toBe(true);
      expect(result[0].name).toContain('Office');
    });

    it('should return empty array when no suppliers found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await supplierService.getAllSuppliers('nonexistent');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle network error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(supplierService.getAllSuppliers())
        .rejects.toThrow('Network error');
    });
  });

  describe('READ - getSupplierById', () => {
    it('should get supplier by id', async () => {
      const mockSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        contactPerson: 'John Doe',
        email: 'test@supplier.com',
        phone: '+41 44 123 45 67',
        address: 'Test Street 1',
        zipCode: '8000',
        city: 'Zürich',
        country: 'Switzerland',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.getSupplierById('supplier-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/suppliers/supplier-123');
      expect(result).toEqual(mockSupplier);
      expect(result.id).toBe('supplier-123');
    });

    it('should get supplier with all optional fields', async () => {
      const mockSupplier: Supplier = {
        id: 'supplier-full',
        name: 'Complete Supplier',
        contactPerson: 'Jane Smith',
        email: 'jane@supplier.com',
        phone: '+41 44 999 88 77',
        address: 'Complete Street 99',
        zipCode: '8050',
        city: 'Zürich',
        country: 'Switzerland',
        taxId: 'CHE-444.555.666',
        notes: 'Strategic partner with volume discounts',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.getSupplierById('supplier-full');

      expect(result.contactPerson).toBe('Jane Smith');
      expect(result.taxId).toBe('CHE-444.555.666');
      expect(result.notes).toBe('Strategic partner with volume discounts');
    });

    it('should get inactive supplier', async () => {
      const mockSupplier: Supplier = {
        id: 'supplier-inactive',
        name: 'Old Supplier',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.getSupplierById('supplier-inactive');

      expect(result.isActive).toBe(false);
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Supplier not found'));

      await expect(supplierService.getSupplierById('nonexistent-id'))
        .rejects.toThrow('Supplier not found');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateSupplier', () => {
    it('should update supplier name', async () => {
      const updates: Partial<Supplier> = {
        name: 'Updated Supplier Name',
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Updated Supplier Name',
        email: 'old@supplier.com',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/suppliers/supplier-123', updates);
      expect(result.name).toBe('Updated Supplier Name');
      expect(result.updatedAt).not.toBe(result.createdAt);
    });

    it('should update contact information', async () => {
      const updates: Partial<Supplier> = {
        contactPerson: 'New Contact Person',
        email: 'newemail@supplier.com',
        phone: '+41 44 999 99 99',
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        contactPerson: 'New Contact Person',
        email: 'newemail@supplier.com',
        phone: '+41 44 999 99 99',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result.contactPerson).toBe('New Contact Person');
      expect(result.email).toBe('newemail@supplier.com');
      expect(result.phone).toBe('+41 44 999 99 99');
    });

    it('should update address information', async () => {
      const updates: Partial<Supplier> = {
        address: 'New Industrial Road 456',
        zipCode: '8050',
        city: 'Oerlikon',
        country: 'Switzerland',
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        address: 'New Industrial Road 456',
        zipCode: '8050',
        city: 'Oerlikon',
        country: 'Switzerland',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result.address).toBe('New Industrial Road 456');
      expect(result.city).toBe('Oerlikon');
    });

    it('should update tax ID', async () => {
      const updates: Partial<Supplier> = {
        taxId: 'CHE-777.888.999',
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        taxId: 'CHE-777.888.999',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result.taxId).toBe('CHE-777.888.999');
    });

    it('should update notes', async () => {
      const updates: Partial<Supplier> = {
        notes: 'Payment terms: Net 30 days, 2% discount for early payment',
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        notes: 'Payment terms: Net 30 days, 2% discount for early payment',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result.notes).toBe('Payment terms: Net 30 days, 2% discount for early payment');
    });

    it('should deactivate supplier', async () => {
      const updates: Partial<Supplier> = {
        isActive: false,
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result.isActive).toBe(false);
    });

    it('should reactivate supplier', async () => {
      const updates: Partial<Supplier> = {
        isActive: true,
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result.isActive).toBe(true);
    });

    it('should update all fields at once', async () => {
      const updates: Partial<Supplier> = {
        name: 'Completely Updated Supplier',
        contactPerson: 'Max Mustermann',
        email: 'max@supplier.ch',
        phone: '+41 44 111 22 33',
        address: 'Neue Industriestrasse 88',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
        taxId: 'CHE-888.777.666',
        notes: 'All fields updated, preferred partner',
        isActive: false,
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Completely Updated Supplier',
        contactPerson: 'Max Mustermann',
        email: 'max@supplier.ch',
        phone: '+41 44 111 22 33',
        address: 'Neue Industriestrasse 88',
        zipCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
        taxId: 'CHE-888.777.666',
        notes: 'All fields updated, preferred partner',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T15:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result).toMatchObject(updates);
    });

    it('should clear optional fields', async () => {
      const updates: Partial<Supplier> = {
        contactPerson: undefined,
        notes: undefined,
      };

      const mockUpdatedSupplier: Supplier = {
        id: 'supplier-123',
        name: 'Test Supplier',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T16:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedSupplier });

      const result = await supplierService.updateSupplier('supplier-123', updates);

      expect(result.contactPerson).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should handle update error', async () => {
      const updates: Partial<Supplier> = {
        email: 'duplicate@supplier.com',
      };

      mockedApi.put.mockRejectedValue(new Error('Email already in use'));

      await expect(supplierService.updateSupplier('supplier-123', updates))
        .rejects.toThrow('Email already in use');
    });

    it('should handle not found error on update', async () => {
      const updates: Partial<Supplier> = {
        name: 'Updated Name',
      };

      mockedApi.put.mockRejectedValue(new Error('Supplier not found'));

      await expect(supplierService.updateSupplier('nonexistent-id', updates))
        .rejects.toThrow('Supplier not found');
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteSupplier', () => {
    it('should delete supplier successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await supplierService.deleteSupplier('supplier-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/suppliers/supplier-123');
    });

    it('should delete multiple suppliers', async () => {
      const supplierIds = ['supplier-1', 'supplier-2', 'supplier-3'];

      mockedApi.delete.mockResolvedValue({});

      for (const id of supplierIds) {
        await supplierService.deleteSupplier(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
      expect(mockedApi.delete).toHaveBeenCalledWith('/suppliers/supplier-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/suppliers/supplier-2');
      expect(mockedApi.delete).toHaveBeenCalledWith('/suppliers/supplier-3');
    });

    it('should handle delete error when supplier not found', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Supplier not found'));

      await expect(supplierService.deleteSupplier('nonexistent-id'))
        .rejects.toThrow('Supplier not found');
    });

    it('should handle delete error when supplier has related records', async () => {
      mockedApi.delete.mockRejectedValue(
        new Error('Cannot delete supplier: supplier has related purchase orders')
      );

      await expect(supplierService.deleteSupplier('supplier-123'))
        .rejects.toThrow('Cannot delete supplier: supplier has related purchase orders');
    });

    it('should handle network error on delete', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Network error'));

      await expect(supplierService.deleteSupplier('supplier-123'))
        .rejects.toThrow('Network error');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Supplier Lifecycle', () => {
    it('should complete full CRUD lifecycle', async () => {
      // CREATE
      const newSupplier: Partial<Supplier> = {
        name: 'Lifecycle Test Supplier',
        email: 'lifecycle@supplier.ch',
        phone: '+41 44 123 45 67',
        city: 'Zürich',
        isActive: true,
      };

      const createdSupplier: Supplier = {
        id: 'supplier-lifecycle',
        name: 'Lifecycle Test Supplier',
        email: 'lifecycle@supplier.ch',
        phone: '+41 44 123 45 67',
        city: 'Zürich',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdSupplier });
      const created = await supplierService.createSupplier(newSupplier);
      expect(created.id).toBe('supplier-lifecycle');

      // READ
      mockedApi.get.mockResolvedValue({ data: createdSupplier });
      const fetched = await supplierService.getSupplierById('supplier-lifecycle');
      expect(fetched.name).toBe('Lifecycle Test Supplier');

      // UPDATE
      const updates: Partial<Supplier> = {
        name: 'Updated Lifecycle Supplier',
        contactPerson: 'New Contact',
      };

      const updatedSupplier: Supplier = {
        ...createdSupplier,
        name: 'Updated Lifecycle Supplier',
        contactPerson: 'New Contact',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: updatedSupplier });
      const updated = await supplierService.updateSupplier('supplier-lifecycle', updates);
      expect(updated.name).toBe('Updated Lifecycle Supplier');
      expect(updated.contactPerson).toBe('New Contact');

      // DELETE
      mockedApi.delete.mockResolvedValue({});
      await supplierService.deleteSupplier('supplier-lifecycle');
      expect(mockedApi.delete).toHaveBeenCalledWith('/suppliers/supplier-lifecycle');
    });

    it('should handle supplier activation/deactivation lifecycle', async () => {
      // Create active supplier
      const newSupplier: Partial<Supplier> = {
        name: 'Active Supplier',
        isActive: true,
      };

      const createdSupplier: Supplier = {
        id: 'supplier-active',
        name: 'Active Supplier',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdSupplier });
      const created = await supplierService.createSupplier(newSupplier);
      expect(created.isActive).toBe(true);

      // Deactivate
      const deactivated: Supplier = {
        ...createdSupplier,
        isActive: false,
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: deactivated });
      const updated1 = await supplierService.updateSupplier('supplier-active', { isActive: false });
      expect(updated1.isActive).toBe(false);

      // Reactivate
      const reactivated: Supplier = {
        ...deactivated,
        isActive: true,
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: reactivated });
      const updated2 = await supplierService.updateSupplier('supplier-active', { isActive: true });
      expect(updated2.isActive).toBe(true);
    });

    it('should handle gradual supplier information completion', async () => {
      // Create with minimal info
      const newSupplier: Partial<Supplier> = {
        name: 'Gradual Supplier',
      };

      const createdSupplier: Supplier = {
        id: 'supplier-gradual',
        name: 'Gradual Supplier',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdSupplier });
      const created = await supplierService.createSupplier(newSupplier);
      expect(created.email).toBeUndefined();

      // Add contact info
      const withContact: Supplier = {
        ...createdSupplier,
        email: 'contact@gradual.ch',
        phone: '+41 44 123 45 67',
        updatedAt: '2026-01-01T11:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: withContact });
      const updated1 = await supplierService.updateSupplier('supplier-gradual', {
        email: 'contact@gradual.ch',
        phone: '+41 44 123 45 67',
      });
      expect(updated1.email).toBe('contact@gradual.ch');

      // Add address
      const withAddress: Supplier = {
        ...withContact,
        address: 'Industrial Street 1',
        zipCode: '8000',
        city: 'Zürich',
        country: 'Switzerland',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: withAddress });
      const updated2 = await supplierService.updateSupplier('supplier-gradual', {
        address: 'Industrial Street 1',
        zipCode: '8000',
        city: 'Zürich',
        country: 'Switzerland',
      });
      expect(updated2.address).toBe('Industrial Street 1');
      expect(updated2.city).toBe('Zürich');
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle supplier with minimal Swiss information', async () => {
      const supplierData: Partial<Supplier> = {
        name: 'Swiss Supplier AG',
        taxId: 'CHE-999.888.777',
      };

      const mockSupplier: Supplier = {
        id: 'supplier-swiss-min',
        ...supplierData as Supplier,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(supplierData);

      expect(result.taxId).toBe('CHE-999.888.777');
    });

    it('should handle supplier with very long name', async () => {
      const longName = 'Very Long Supplier Company Name '.repeat(10);
      const supplierData: Partial<Supplier> = {
        name: longName.substring(0, 255),
      };

      const mockSupplier: Supplier = {
        id: 'supplier-long-name',
        name: longName.substring(0, 255),
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(supplierData);

      expect(result.name.length).toBeLessThanOrEqual(255);
    });

    it('should handle supplier with special characters', async () => {
      const supplierData: Partial<Supplier> = {
        name: 'Café & Restaurant Supply "Le Français"',
        address: 'Rue de l\'Industrie 25',
        city: 'Genève',
        notes: 'Wholesale prices: 15% discount @bulk orders (>100 units)',
      };

      const mockSupplier: Supplier = {
        id: 'supplier-special',
        ...supplierData as Supplier,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(supplierData);

      expect(result.name).toBe('Café & Restaurant Supply "Le Français"');
      expect(result.address).toBe('Rue de l\'Industrie 25');
    });

    it('should handle supplier with international phone formats', async () => {
      const suppliers = [
        { phone: '+41 44 123 45 67' }, // Swiss
        { phone: '+49 89 12345678' },  // German
        { phone: '+43 1 1234567' },    // Austrian
        { phone: '+33 1 42 86 82 00' }, // French
      ];

      for (const supplierData of suppliers) {
        const mockSupplier: Supplier = {
          id: `supplier-${supplierData.phone}`,
          name: 'Test Supplier',
          ...supplierData,
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        };

        mockedApi.post.mockResolvedValue({ data: mockSupplier });

        const result = await supplierService.createSupplier({ name: 'Test Supplier', ...supplierData });
        expect(result.phone).toBe(supplierData.phone);
      }
    });

    it('should handle supplier with very long notes', async () => {
      const longNotes = 'Payment terms and conditions: '.repeat(100);
      const supplierData: Partial<Supplier> = {
        name: 'Supplier with Notes',
        notes: longNotes,
      };

      const mockSupplier: Supplier = {
        id: 'supplier-notes',
        name: 'Supplier with Notes',
        notes: longNotes,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockSupplier });

      const result = await supplierService.createSupplier(supplierData);

      expect(result.notes).toBeDefined();
      expect(result.notes!.length).toBeGreaterThan(1000);
    });

    it('should handle empty optional fields', async () => {
      const supplierData: Partial<Supplier> = {
        name: 'Minimal Supplier',
        email: '',
        phone: '',
      };

      mockedApi.post.mockRejectedValue(new Error('Email and phone cannot be empty strings'));

      await expect(supplierService.createSupplier(supplierData))
        .rejects.toThrow('Email and phone cannot be empty strings');
    });

    it('should handle invalid email format', async () => {
      const supplierData: Partial<Supplier> = {
        name: 'Test Supplier',
        email: 'invalid-email',
      };

      mockedApi.post.mockRejectedValue(new Error('Invalid email format'));

      await expect(supplierService.createSupplier(supplierData))
        .rejects.toThrow('Invalid email format');
    });

    it('should handle supplier name with only whitespace', async () => {
      const supplierData: Partial<Supplier> = {
        name: '   ',
      };

      mockedApi.post.mockRejectedValue(new Error('Supplier name cannot be only whitespace'));

      await expect(supplierService.createSupplier(supplierData))
        .rejects.toThrow('Supplier name cannot be only whitespace');
    });
  });
});
