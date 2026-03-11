import { PrismaClient, NotificationType } from '@prisma/client';
import { emitToUser } from '../websocket/socketServer';

const prisma = new PrismaClient();

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
}

// Create a notification and push via WebSocket
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
    },
  });

  // Push to user via WebSocket
  emitToUser(input.userId, 'notification:new', notification);

  return notification;
}

// Get notifications for a user
export async function getUserNotifications(userId: string, limit = 50, onlyUnread = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(onlyUnread ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

// Mark a single notification as read
export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// Create notification for new message (to integrate with existing message system)
export async function notifyNewMessage(receiverId: string, senderName: string, subject: string, messageId: string) {
  return createNotification({
    userId: receiverId,
    type: 'MESSAGE',
    title: `Neue Nachricht von ${senderName}`,
    body: subject,
    linkUrl: `/messages/${messageId}`,
  });
}
