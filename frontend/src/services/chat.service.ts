import api from './api';

export interface ChatRoom {
  id: string;
  name: string | null;
  type: 'DIRECT' | 'GROUP';
  createdAt: string;
  updatedAt: string;
  members: ChatRoomMember[];
  messages: ChatMessagePreview[];
  unreadCount: number;
}

export interface ChatRoomMember {
  id: string;
  roomId: string;
  userId: string;
  lastReadAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface ChatMessagePreview {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Get all chat rooms
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await api.get('/chat/rooms');
  return response.data;
};

// Get or create direct chat
export const getOrCreateDirectChat = async (userId: string): Promise<ChatRoom> => {
  const response = await api.post('/chat/rooms/direct', { userId });
  return response.data;
};

// Create group chat
export const createGroupChat = async (name: string, memberIds: string[]): Promise<ChatRoom> => {
  const response = await api.post('/chat/rooms/group', { name, memberIds });
  return response.data;
};

// Get messages for a room
export const getChatMessages = async (roomId: string, cursor?: string): Promise<ChatMessage[]> => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const response = await api.get(`/chat/rooms/${roomId}/messages?${params.toString()}`);
  return response.data;
};

// Send message
export const sendChatMessage = async (roomId: string, content: string): Promise<ChatMessage> => {
  const response = await api.post(`/chat/rooms/${roomId}/messages`, { content });
  return response.data;
};

// Mark room as read
export const markChatRoomAsRead = async (roomId: string): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/read`);
};

// Get unread chat count
export const getUnreadChatCount = async (): Promise<number> => {
  const response = await api.get('/chat/unread-count');
  return response.data.count;
};
