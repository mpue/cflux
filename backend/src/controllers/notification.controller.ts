import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import * as notificationService from '../services/notification.service';

// GET /api/notifications - Get user's notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const onlyUnread = req.query.unread === 'true';
    const notifications = await notificationService.getUserNotifications(req.user!.id, limit, onlyUnread);
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

// GET /api/notifications/unread-count - Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadNotificationCount(req.user!.id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// PATCH /api/notifications/:id/read - Mark single notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markNotificationAsRead(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// PATCH /api/notifications/read-all - Mark all as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllNotificationsAsRead(req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};
