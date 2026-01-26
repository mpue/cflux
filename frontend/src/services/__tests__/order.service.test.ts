import orderService from '../order.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('orderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrder = {
    id: '1',
    orderNumber: 'BO-000001',
    supplierId: 'supplier1',
    orderDate: '2024-01-01T00:00:00.000Z',
    expectedDeliveryDate: '2024-01-15T00:00:00.000Z',
    status: 'DRAFT' as const,
    priority: 'MEDIUM' as const,
    title: 'Office Supplies',
    description: 'Monthly office supplies order',
    totalAmount: 1000,
    vatAmount: 77,
    grandTotal: 1077,
    currency: 'CHF',
    requestedById: 'user1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    supplier: {
      id: 'supplier1',
      name: 'Office Depot',
      email: 'orders@depot.com',
      phone: '+41 44 123 45 67'
    },
    requestedBy: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    },
    items: [
      {
        id: 'item1',
        name: 'Paper A4',
        quantity: 10,
        unit: 'Pack',
        unitPrice: 5.0,
        vatRate: 7.7,
        totalPrice: 50.0
      }
    ]
  };

  describe('getOrders', () => {
    it('should fetch all orders without params', async () => {
      const mockOrders = [mockOrder];
      mockApi.get.mockResolvedValue({ data: mockOrders });

      const result = await orderService.getOrders();

      expect(mockApi.get).toHaveBeenCalledWith('/orders', { params: undefined });
      expect(result).toEqual(mockOrders);
    });

    it('should fetch orders with search filter', async () => {
      const mockOrders = [mockOrder];
      mockApi.get.mockResolvedValue({ data: mockOrders });

      const result = await orderService.getOrders({ search: 'Office' });

      expect(mockApi.get).toHaveBeenCalledWith('/orders', {
        params: { search: 'Office' }
      });
      expect(result).toEqual(mockOrders);
    });

    it('should fetch orders with status filter', async () => {
      const mockOrders = [{ ...mockOrder, status: 'APPROVED' as const }];
      mockApi.get.mockResolvedValue({ data: mockOrders });

      const result = await orderService.getOrders({ status: 'APPROVED' });

      expect(mockApi.get).toHaveBeenCalledWith('/orders', {
        params: { status: 'APPROVED' }
      });
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrderById', () => {
    it('should fetch an order by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockOrder });

      const result = await orderService.getOrderById('1');

      expect(mockApi.get).toHaveBeenCalledWith('/orders/1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const createData = {
        supplierId: 'supplier1',
        title: 'New Order',
        description: 'Test order',
        priority: 'HIGH',
        items: [
          {
            name: 'Test Item',
            quantity: 5,
            unit: 'Stück',
            unitPrice: 10.0,
            vatRate: 7.7
          }
        ]
      };
      mockApi.post.mockResolvedValue({ data: mockOrder });

      const result = await orderService.createOrder(createData);

      expect(mockApi.post).toHaveBeenCalledWith('/orders', createData);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrder', () => {
    it('should update an order', async () => {
      const updateData = {
        title: 'Updated Order',
        notes: 'Updated notes'
      };
      const updatedOrder = { ...mockOrder, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedOrder });

      const result = await orderService.updateOrder('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/orders/1', updateData);
      expect(result.title).toBe('Updated Order');
    });
  });

  describe('requestApproval', () => {
    it('should request approval for an order', async () => {
      const requestedOrder = { ...mockOrder, status: 'REQUESTED' as const };
      mockApi.post.mockResolvedValue({ data: requestedOrder });

      const result = await orderService.requestApproval('1');

      expect(mockApi.post).toHaveBeenCalledWith('/orders/1/request-approval');
      expect(result.status).toBe('REQUESTED');
    });
  });

  describe('approveOrder', () => {
    it('should approve an order', async () => {
      const approvedOrder = {
        ...mockOrder,
        status: 'APPROVED' as const,
        approvedById: 'admin1',
        approvedAt: '2024-01-02T00:00:00.000Z'
      };
      mockApi.post.mockResolvedValue({ data: approvedOrder });

      const result = await orderService.approveOrder('1');

      expect(mockApi.post).toHaveBeenCalledWith('/orders/1/approve');
      expect(result.status).toBe('APPROVED');
      expect(result.approvedById).toBe('admin1');
    });
  });

  describe('rejectOrder', () => {
    it('should reject an order with reason', async () => {
      const rejectedOrder = {
        ...mockOrder,
        status: 'REJECTED' as const,
        rejectedById: 'admin1',
        rejectedAt: '2024-01-02T00:00:00.000Z',
        rejectionReason: 'Budget exceeded'
      };
      mockApi.post.mockResolvedValue({ data: rejectedOrder });

      const result = await orderService.rejectOrder('1', 'Budget exceeded');

      expect(mockApi.post).toHaveBeenCalledWith('/orders/1/reject', {
        reason: 'Budget exceeded'
      });
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Budget exceeded');
    });
  });

  describe('markAsOrdered', () => {
    it('should mark an order as ordered', async () => {
      const orderedOrder = { ...mockOrder, status: 'ORDERED' as const };
      mockApi.post.mockResolvedValue({ data: orderedOrder });

      const result = await orderService.markAsOrdered('1');

      expect(mockApi.post).toHaveBeenCalledWith('/orders/1/mark-ordered');
      expect(result.status).toBe('ORDERED');
    });
  });

  describe('recordDelivery', () => {
    it('should record a delivery for an order', async () => {
      const deliveryData = {
        deliveryDate: '2024-01-15T00:00:00.000Z',
        deliveryNumber: 'LI-001',
        notes: 'Partial delivery',
        items: [
          {
            orderItemId: 'item1',
            name: 'Paper A4',
            quantity: 5,
            unit: 'Pack'
          }
        ]
      };
      const mockDelivery = {
        id: 'del1',
        orderId: '1',
        deliveryDate: '2024-01-15T00:00:00.000Z',
        deliveryNumber: 'LI-001',
        receivedById: 'user1',
        createdAt: '2024-01-15T00:00:00.000Z',
        receivedBy: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe'
        },
        items: deliveryData.items as any
      };
      mockApi.post.mockResolvedValue({ data: mockDelivery });

      const result = await orderService.recordDelivery('1', deliveryData);

      expect(mockApi.post).toHaveBeenCalledWith('/orders/1/deliveries', deliveryData);
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const cancelledOrder = { ...mockOrder, status: 'CANCELLED' as const };
      mockApi.post.mockResolvedValue({ data: cancelledOrder });

      const result = await orderService.cancelOrder('1');

      expect(mockApi.post).toHaveBeenCalledWith('/orders/1/cancel');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('deleteOrder', () => {
    it('should delete an order', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await orderService.deleteOrder('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/orders/1');
    });
  });

  describe('getStatistics', () => {
    it('should fetch order statistics without date range', async () => {
      const mockStats = {
        totalOrders: 50,
        byStatus: {
          draft: 5,
          requested: 10,
          approved: 15,
          ordered: 10,
          received: 8,
          cancelled: 2
        },
        totalValue: 50000
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await orderService.getStatistics();

      expect(mockApi.get).toHaveBeenCalledWith('/orders/statistics', {
        params: undefined
      });
      expect(result).toEqual(mockStats);
    });

    it('should fetch order statistics with date range', async () => {
      const mockStats = {
        totalOrders: 20,
        byStatus: {
          draft: 2,
          requested: 5,
          approved: 8,
          ordered: 3,
          received: 2,
          cancelled: 0
        },
        totalValue: 20000
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await orderService.getStatistics({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(mockApi.get).toHaveBeenCalledWith('/orders/statistics', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' }
      });
      expect(result).toEqual(mockStats);
    });
  });
});
