import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import * as chatService from '../services/chat.service';

// GET /api/chat/rooms - Get user's chat rooms
export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await chatService.getUserRooms(req.user!.id);
    res.json(rooms);
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({ error: 'Failed to get chat rooms' });
  }
};

// POST /api/chat/rooms/direct - Create or get direct chat
export const getOrCreateDirect = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }
    const room = await chatService.getOrCreateDirectRoom(req.user!.id, userId);
    res.json(room);
  } catch (error) {
    console.error('Error creating direct chat:', error);
    res.status(500).json({ error: 'Failed to create direct chat' });
  }
};

// POST /api/chat/rooms/group - Create group chat
export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length < 1) {
      return res.status(400).json({ error: 'name and memberIds (array) are required' });
    }
    // Always include creator
    const allMembers = Array.from(new Set([req.user!.id, ...memberIds]));
    const room = await chatService.createGroupRoom(name, allMembers);
    res.json(room);
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ error: 'Failed to create group chat' });
  }
};

// GET /api/chat/rooms/:roomId/messages - Get room messages
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await chatService.getRoomMessages(roomId, cursor, limit);
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// POST /api/chat/rooms/:roomId/messages - Send message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    const message = await chatService.sendChatMessage(roomId, req.user!.id, content.trim());
    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// POST /api/chat/rooms/:roomId/read - Mark as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    await chatService.markRoomAsRead(roomId, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// GET /api/chat/unread-count - Get total unread chat messages
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await chatService.getUnreadChatCount(req.user!.id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};
