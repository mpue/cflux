import { inventoryService } from '../inventory.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('inventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArticle = {
    id: 'art1',
    articleNumber: 'A001',
    name: 'Test Article',
    unit: 'Stück',
    price: 10.0,
    isActive: true
  };

  const mockInventoryItem = {
    id: '1',
    articleId: 'art1',
    quantity: 100,
    minQuantity: 10,
    location: 'Warehouse A',
    notes: 'Test notes',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    article: mockArticle
  };

  describe('getAll', () => {
    it('should fetch all active inventory items', async () => {
      const mockData = [mockInventoryItem];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await inventoryService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/inventory?includeInactive=false');
      expect(result).toEqual(mockData);
    });

    it('should fetch all inventory items including inactive', async () => {
      const mockData = [
        mockInventoryItem,
        { ...mockInventoryItem, id: '2', article: { ...mockArticle, isActive: false } }
      ];
      mockApi.get.mockResolvedValue({ data: mockData });

      const result = await inventoryService.getAll(true);

      expect(mockApi.get).toHaveBeenCalledWith('/inventory?includeInactive=true');
      expect(result).toEqual(mockData);
    });
  });

  describe('getById', () => {
    it('should fetch an inventory item by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockInventoryItem });

      const result = await inventoryService.getById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/inventory/1');
      expect(result).toEqual(mockInventoryItem);
    });
  });

  describe('upsert', () => {
    it('should create or update an inventory item', async () => {
      const upsertData = {
        articleId: 'art1',
        quantity: 50,
        minQuantity: 5,
        location: 'Warehouse B',
        notes: 'New notes'
      };
      mockApi.post.mockResolvedValue({ data: mockInventoryItem });

      const result = await inventoryService.upsert(upsertData);

      expect(mockApi.post).toHaveBeenCalledWith('/inventory', upsertData);
      expect(result).toEqual(mockInventoryItem);
    });
  });

  describe('recordMovement', () => {
    it('should record an inventory movement', async () => {
      const movementData = {
        inventoryItemId: '1',
        type: 'IN' as const,
        quantity: 10,
        reason: 'Restock'
      };
      const mockMovement = {
        id: 'mov1',
        type: 'IN',
        quantity: 10,
        reason: 'Restock',
        createdAt: '2024-01-01T00:00:00.000Z',
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      };
      mockApi.post.mockResolvedValue({ data: mockMovement });

      const result = await inventoryService.recordMovement(movementData);

      expect(mockApi.post).toHaveBeenCalledWith('/inventory/movement', movementData);
      expect(result).toEqual(mockMovement);
    });

    it('should record an OUT movement', async () => {
      const movementData = {
        inventoryItemId: '1',
        type: 'OUT' as const,
        quantity: 5,
        reason: 'Sale'
      };
      const mockMovement = {
        id: 'mov2',
        type: 'OUT',
        quantity: 5,
        reason: 'Sale',
        createdAt: '2024-01-01T00:00:00.000Z',
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      };
      mockApi.post.mockResolvedValue({ data: mockMovement });

      const result = await inventoryService.recordMovement(movementData);

      expect(mockApi.post).toHaveBeenCalledWith('/inventory/movement', movementData);
      expect(result).toEqual(mockMovement);
    });

    it('should record an ADJUSTMENT movement', async () => {
      const movementData = {
        inventoryItemId: '1',
        type: 'ADJUSTMENT' as const,
        quantity: -2,
        reason: 'Damaged items'
      };
      const mockMovement = {
        id: 'mov3',
        type: 'ADJUSTMENT',
        quantity: -2,
        reason: 'Damaged items',
        createdAt: '2024-01-01T00:00:00.000Z',
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      };
      mockApi.post.mockResolvedValue({ data: mockMovement });

      const result = await inventoryService.recordMovement(movementData);

      expect(mockApi.post).toHaveBeenCalledWith('/inventory/movement', movementData);
      expect(result).toEqual(mockMovement);
    });
  });

  describe('getLowStock', () => {
    it('should fetch items with low stock', async () => {
      const lowStockItems = [
        { ...mockInventoryItem, quantity: 5, minQuantity: 10 },
        { ...mockInventoryItem, id: '2', quantity: 3, minQuantity: 15 }
      ];
      mockApi.get.mockResolvedValue({ data: lowStockItems });

      const result = await inventoryService.getLowStock();

      expect(mockApi.get).toHaveBeenCalledWith('/inventory/low-stock');
      expect(result).toEqual(lowStockItems);
    });
  });

  describe('delete', () => {
    it('should delete an inventory item', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await inventoryService.delete('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/inventory/1');
    });
  });
});
