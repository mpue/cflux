import { Response } from 'express';
import { PrismaClient, OrderStatus, OrderPriority } from '@prisma/client';
import { AuthRequest } from '../types/auth';

const prisma = new PrismaClient();

// Get all orders
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, supplierId, priority, projectId, isActive, startDate, endDate } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { supplier: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate as string);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: {
              select: {
                id: true,
                articleNumber: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        deliveries: {
          orderBy: {
            deliveryDate: 'desc',
          },
          include: {
            receivedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            items: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order by ID
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: true,
          },
        },
        deliveries: {
          orderBy: {
            deliveryDate: 'desc',
          },
          include: {
            receivedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            items: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Create new order
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      supplierId,
      orderDate,
      expectedDeliveryDate,
      title,
      description,
      notes,
      internalNotes,
      priority,
      deliveryAddress,
      deliveryContact,
      deliveryPhone,
      projectId,
      costCenter,
      items,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one order item is required' });
    }

    // Generate order number
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
    });

    const orderNumber = lastOrder
      ? `BO-${String(parseInt(lastOrder.orderNumber.split('-')[1]) + 1).padStart(6, '0')}`
      : 'BO-000001';

    // Calculate totals
    let totalAmount = 0;
    let vatAmount = 0;

    const orderItems = items.map((item: any, index: number) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemVat = itemTotal * (item.vatRate / 100);
      totalAmount += itemTotal;
      vatAmount += itemVat;

      return {
        position: index + 1,
        articleId: item.articleId || null,
        articleNumber: item.articleNumber || null,
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit || 'Stück',
        receivedQuantity: 0,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate || 7.7,
        totalPrice: itemTotal,
        notes: item.notes || null,
      };
    });

    const grandTotal = totalAmount + vatAmount;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        supplierId: supplierId || null,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        status: OrderStatus.DRAFT,
        priority: priority || OrderPriority.MEDIUM,
        title,
        description: description || null,
        notes: notes || null,
        internalNotes: internalNotes || null,
        totalAmount,
        vatAmount,
        grandTotal,
        deliveryAddress: deliveryAddress || null,
        deliveryContact: deliveryContact || null,
        deliveryPhone: deliveryPhone || null,
        requestedById: req.user!.id,
        projectId: projectId || null,
        costCenter: costCenter || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: true,
          },
        },
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Update order
export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      supplierId,
      orderDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      status,
      priority,
      title,
      description,
      notes,
      internalNotes,
      deliveryAddress,
      deliveryContact,
      deliveryPhone,
      projectId,
      costCenter,
      items,
    } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be edited
    if (existingOrder.status === OrderStatus.CANCELLED || existingOrder.status === OrderStatus.RECEIVED) {
      return res.status(400).json({ error: 'Cannot edit cancelled or received orders' });
    }

    let updateData: any = {
      supplierId: supplierId !== undefined ? supplierId : undefined,
      orderDate: orderDate ? new Date(orderDate) : undefined,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : undefined,
      status: status || undefined,
      priority: priority || undefined,
      title: title || undefined,
      description: description !== undefined ? description : undefined,
      notes: notes !== undefined ? notes : undefined,
      internalNotes: internalNotes !== undefined ? internalNotes : undefined,
      deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : undefined,
      deliveryContact: deliveryContact !== undefined ? deliveryContact : undefined,
      deliveryPhone: deliveryPhone !== undefined ? deliveryPhone : undefined,
      projectId: projectId !== undefined ? projectId : undefined,
      costCenter: costCenter !== undefined ? costCenter : undefined,
    };

    // If items are provided, recalculate totals
    if (items) {
      let totalAmount = 0;
      let vatAmount = 0;

      const orderItems = items.map((item: any, index: number) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemVat = itemTotal * (item.vatRate / 100);
        totalAmount += itemTotal;
        vatAmount += itemVat;

        return {
          position: index + 1,
          articleId: item.articleId || null,
          articleNumber: item.articleNumber || null,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit: item.unit || 'Stück',
          receivedQuantity: item.receivedQuantity || 0,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate || 7.7,
          totalPrice: itemTotal,
          notes: item.notes || null,
        };
      });

      const grandTotal = totalAmount + vatAmount;

      // Delete existing items and create new ones
      await prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      updateData.totalAmount = totalAmount;
      updateData.vatAmount = vatAmount;
      updateData.grandTotal = grandTotal;
      updateData.items = {
        create: orderItems,
      };
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        project: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: true,
          },
        },
        deliveries: {
          include: {
            receivedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            items: true,
          },
        },
      },
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Request order approval
export const requestOrderApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== OrderStatus.DRAFT) {
      return res.status(400).json({ error: 'Only draft orders can be submitted for approval' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.REQUESTED,
      },
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error requesting order approval:', error);
    res.status(500).json({ error: 'Failed to request order approval' });
  }
};

// Approve order
export const approveOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== OrderStatus.REQUESTED) {
      return res.status(400).json({ error: 'Only requested orders can be approved' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.APPROVED,
        approvedById: req.user!.id,
        approvedAt: new Date(),
      },
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({ error: 'Failed to approve order' });
  }
};

// Reject order
export const rejectOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== OrderStatus.REQUESTED) {
      return res.status(400).json({ error: 'Only requested orders can be rejected' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.REJECTED,
        rejectedById: req.user!.id,
        rejectedAt: new Date(),
        rejectionReason: reason || null,
      },
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
};

// Mark order as ordered
export const markOrderAsOrdered = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== OrderStatus.APPROVED) {
      return res.status(400).json({ error: 'Only approved orders can be marked as ordered' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.ORDERED,
      },
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: true,
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error marking order as ordered:', error);
    res.status(500).json({ error: 'Failed to mark order as ordered' });
  }
};

// Record delivery
export const recordDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deliveryDate, deliveryNumber, notes, items } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== OrderStatus.ORDERED && order.status !== OrderStatus.PARTIALLY_RECEIVED) {
      return res.status(400).json({ error: 'Can only record deliveries for ordered or partially received orders' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Delivery items are required' });
    }

    // Create delivery
    const delivery = await prisma.orderDelivery.create({
      data: {
        orderId: id,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        deliveryNumber: deliveryNumber || null,
        notes: notes || null,
        receivedById: req.user!.id,
        items: {
          create: items.map((item: any) => ({
            orderItemId: item.orderItemId || null,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'Stück',
            notes: item.notes || null,
          })),
        },
      },
      include: {
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
      },
    });

    // Update received quantities for order items
    for (const item of items) {
      if (item.orderItemId) {
        const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
        if (orderItem) {
          await prisma.orderItem.update({
            where: { id: item.orderItemId },
            data: {
              receivedQuantity: orderItem.receivedQuantity + item.quantity,
            },
          });
        }
      }
    }

    // Check if order is fully received
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (updatedOrder) {
      const allItemsReceived = updatedOrder.items.every(
        (item) => item.receivedQuantity >= item.quantity
      );

      const someItemsReceived = updatedOrder.items.some((item) => item.receivedQuantity > 0);

      const newStatus = allItemsReceived
        ? OrderStatus.RECEIVED
        : someItemsReceived
        ? OrderStatus.PARTIALLY_RECEIVED
        : OrderStatus.ORDERED;

      if (newStatus !== updatedOrder.status) {
        await prisma.order.update({
          where: { id },
          data: {
            status: newStatus,
            actualDeliveryDate: allItemsReceived ? new Date() : null,
          },
        });
      }
    }

    res.status(201).json(delivery);
  } catch (error) {
    console.error('Error recording delivery:', error);
    res.status(500).json({ error: 'Failed to record delivery' });
  }
};

// Cancel order
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === OrderStatus.RECEIVED || order.status === OrderStatus.CANCELLED) {
      return res.status(400).json({ error: 'Cannot cancel received or already cancelled orders' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
      include: {
        supplier: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: true,
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Delete order (soft delete)
export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await prisma.order.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

// Get order statistics
export const getOrderStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      isActive: true,
    };

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate as string);
      }
    }

    const [
      totalOrders,
      draftOrders,
      requestedOrders,
      approvedOrders,
      orderedOrders,
      receivedOrders,
      cancelledOrders,
      totalValue,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: OrderStatus.DRAFT } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.REQUESTED } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.APPROVED } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.ORDERED } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.RECEIVED } }),
      prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      prisma.order.aggregate({
        where: { ...where, status: { not: OrderStatus.CANCELLED } },
        _sum: { grandTotal: true },
      }),
    ]);

    res.json({
      totalOrders,
      byStatus: {
        draft: draftOrders,
        requested: requestedOrders,
        approved: approvedOrders,
        ordered: orderedOrders,
        received: receivedOrders,
        cancelled: cancelledOrders,
      },
      totalValue: totalValue._sum.grandTotal || 0,
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
};
