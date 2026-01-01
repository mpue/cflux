import api from './api';

export interface Message {
  id: string;
  subject: string;
  body: string;
  senderId: string | null;
  receiverId: string;
  type: 'USER' | 'SYSTEM' | 'WORKFLOW';
  senderFolder: 'INBOX' | 'SENT' | 'TRASH';
  receiverFolder: 'INBOX' | 'SENT' | 'TRASH';
  isRead: boolean;
  readAt: string | null;
  workflowId?: string;
  workflowInstanceId?: string;
  priority: string;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  replyTo?: {
    id: string;
    subject: string;
    body?: string;
    createdAt?: string;
  };
  replies?: Array<{
    id: string;
    subject: string;
    createdAt: string;
    isRead: boolean;
    sender: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface MessageRecipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface SendMessageDto {
  receiverId: string;
  subject: string;
  body: string;
  priority?: string;
  replyToId?: string;
}

// Get messages by folder
export const getMessages = async (folder: 'INBOX' | 'SENT' | 'TRASH' = 'INBOX'): Promise<Message[]> => {
  const response = await api.get(`/messages?folder=${folder}`);
  return response.data;
};

// Get single message
export const getMessage = async (id: string): Promise<Message> => {
  const response = await api.get(`/messages/${id}`);
  return response.data;
};

// Send a new message
export const sendMessage = async (data: SendMessageDto): Promise<Message> => {
  const response = await api.post('/messages', data);
  return response.data;
};

// Move message to another folder
export const moveMessage = async (id: string, folder: 'INBOX' | 'SENT' | 'TRASH'): Promise<Message> => {
  const response = await api.patch(`/messages/${id}/move`, { folder });
  return response.data;
};

// Delete message permanently (must be in trash)
export const deleteMessage = async (id: string): Promise<void> => {
  await api.delete(`/messages/${id}`);
};

// Toggle read/unread status
export const toggleReadStatus = async (id: string, isRead: boolean): Promise<Message> => {
  const response = await api.patch(`/messages/${id}/read`, { isRead });
  return response.data;
};

// Get unread message count
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/messages/unread-count');
  return response.data.count;
};

// Get possible message recipients
export const getMessageRecipients = async (): Promise<MessageRecipient[]> => {
  const response = await api.get('/messages/recipients');
  return response.data;
};
