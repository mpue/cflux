import api from './api';

export interface OrderItem {
  id?: string;
  position?: number;
  articleId?: string;
  articleNumber?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  receivedQuantity?: number;
  unitPrice: number;
  vatRate: number;
  totalPrice?: number;
  notes?: string;
  article?: {
    id: string;
    articleNumber: string;
    name: string;
    unit: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  supplierId?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description?: string;
  notes?: string;
  internalNotes?: string;
  totalAmount: number;
  vatAmount: number;
  grandTotal: number;
  currency: string;
  deliveryAddress?: string;
  deliveryContact?: string;
  deliveryPhone?: string;
  requestedById: string;
  approvedById?: string;
  approvedAt?: string;
  rejectedById?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  projectId?: string;
  costCenter?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rejectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  project?: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  deliveries?: OrderDelivery[];
}

export interface OrderDelivery {
  id: string;
  orderId: string;
  deliveryDate: string;
  deliveryNumber?: string;
  notes?: string;
  receivedById: string;
  createdAt: string;
  receivedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  items: OrderDeliveryItem[];
}

export interface OrderDeliveryItem {
  id: string;
  deliveryId: string;
  orderItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface OrderStatistics {
  totalOrders: number;
  byStatus: {
    draft: number;
    requested: number;
    approved: number;
    ordered: number;
    received: number;
    cancelled: number;
  };
  totalValue: number;
}

export interface CreateOrderData {
  supplierId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  title: string;
  description?: string;
  notes?: string;
  internalNotes?: string;
  priority?: string;
  deliveryAddress?: string;
  deliveryContact?: string;
  deliveryPhone?: string;
  projectId?: string;
  costCenter?: string;
  items: OrderItem[];
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  actualDeliveryDate?: string;
  status?: string;
}

export interface RecordDeliveryData {
  deliveryDate?: string;
  deliveryNumber?: string;
  notes?: string;
  items: {
    orderItemId?: string;
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
}

class OrderService {
  async getOrders(params?: {
    search?: string;
    status?: string;
    supplierId?: string;
    priority?: string;
    projectId?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<Order[]> {
    const response = await api.get('/orders', { params });
    return response.data;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await api.post('/orders', data);
    return response.data;
  }

  async updateOrder(id: string, data: UpdateOrderData): Promise<Order> {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  }

  async requestApproval(id: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/request-approval`);
    return response.data;
  }

  async approveOrder(id: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/approve`);
    return response.data;
  }

  async rejectOrder(id: string, reason?: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/reject`, { reason });
    return response.data;
  }

  async markAsOrdered(id: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/mark-ordered`);
    return response.data;
  }

  async recordDelivery(id: string, data: RecordDeliveryData): Promise<OrderDelivery> {
    const response = await api.post(`/orders/${id}/deliveries`, data);
    return response.data;
  }

  async cancelOrder(id: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  }

  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/orders/${id}`);
  }

  async getStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<OrderStatistics> {
    const response = await api.get('/orders/statistics', { params });
    return response.data;
  }
}

export default new OrderService();
