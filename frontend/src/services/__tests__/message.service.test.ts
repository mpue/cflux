import * as messageService from '../message.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('messageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMessage = {
    id: '1',
    subject: 'Test Subject',
    body: 'Test message body',
    senderId: 'user1',
    receiverId: 'user2',
    type: 'USER' as const,
    senderFolder: 'SENT' as const,
    receiverFolder: 'INBOX' as const,
    isRead: false,
    readAt: null,
    priority: 'normal',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    sender: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    },
    receiver: {
      id: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    }
  };

  describe('getMessages', () => {
    it('should fetch messages from INBOX by default', async () => {
      const mockMessages = [mockMessage];
      mockApi.get.mockResolvedValue({ data: mockMessages });

      const result = await messageService.getMessages();

      expect(mockApi.get).toHaveBeenCalledWith('/messages?folder=INBOX');
      expect(result).toEqual(mockMessages);
    });

    it('should fetch messages from SENT folder', async () => {
      const mockMessages = [{ ...mockMessage, receiverFolder: 'SENT' as const }];
      mockApi.get.mockResolvedValue({ data: mockMessages });

      const result = await messageService.getMessages('SENT');

      expect(mockApi.get).toHaveBeenCalledWith('/messages?folder=SENT');
      expect(result).toEqual(mockMessages);
    });

    it('should fetch messages from TRASH folder', async () => {
      const mockMessages = [{ ...mockMessage, receiverFolder: 'TRASH' as const }];
      mockApi.get.mockResolvedValue({ data: mockMessages });

      const result = await messageService.getMessages('TRASH');

      expect(mockApi.get).toHaveBeenCalledWith('/messages?folder=TRASH');
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessage', () => {
    it('should fetch a single message by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockMessage });

      const result = await messageService.getMessage('1');

      expect(mockApi.get).toHaveBeenCalledWith('/messages/1');
      expect(result).toEqual(mockMessage);
    });
  });

  describe('sendMessage', () => {
    it('should send a new message', async () => {
      const sendData = {
        receiverId: 'user2',
        subject: 'Test Subject',
        body: 'Test message body',
        priority: 'high'
      };
      mockApi.post.mockResolvedValue({ data: mockMessage });

      const result = await messageService.sendMessage(sendData);

      expect(mockApi.post).toHaveBeenCalledWith('/messages', sendData);
      expect(result).toEqual(mockMessage);
    });

    it('should send a reply message', async () => {
      const replyData = {
        receiverId: 'user1',
        subject: 'RE: Test Subject',
        body: 'Reply message',
        replyToId: '1'
      };
      const mockReply = { ...mockMessage, id: '2', replyToId: '1' };
      mockApi.post.mockResolvedValue({ data: mockReply });

      const result = await messageService.sendMessage(replyData);

      expect(mockApi.post).toHaveBeenCalledWith('/messages', replyData);
      expect(result.replyToId).toBe('1');
    });
  });

  describe('moveMessage', () => {
    it('should move a message to TRASH', async () => {
      const movedMessage = { ...mockMessage, receiverFolder: 'TRASH' as const };
      mockApi.patch.mockResolvedValue({ data: movedMessage });

      const result = await messageService.moveMessage('1', 'TRASH');

      expect(mockApi.patch).toHaveBeenCalledWith('/messages/1/move', { folder: 'TRASH' });
      expect(result.receiverFolder).toBe('TRASH');
    });

    it('should restore a message from TRASH to INBOX', async () => {
      const restoredMessage = { ...mockMessage, receiverFolder: 'INBOX' as const };
      mockApi.patch.mockResolvedValue({ data: restoredMessage });

      const result = await messageService.moveMessage('1', 'INBOX');

      expect(mockApi.patch).toHaveBeenCalledWith('/messages/1/move', { folder: 'INBOX' });
      expect(result.receiverFolder).toBe('INBOX');
    });
  });

  describe('deleteMessage', () => {
    it('should permanently delete a message', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await messageService.deleteMessage('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/messages/1');
    });
  });

  describe('toggleReadStatus', () => {
    it('should mark a message as read', async () => {
      const readMessage = {
        ...mockMessage,
        isRead: true,
        readAt: '2024-01-01T10:00:00.000Z'
      };
      mockApi.patch.mockResolvedValue({ data: readMessage });

      const result = await messageService.toggleReadStatus('1', true);

      expect(mockApi.patch).toHaveBeenCalledWith('/messages/1/read', { isRead: true });
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeTruthy();
    });

    it('should mark a message as unread', async () => {
      const unreadMessage = { ...mockMessage, isRead: false, readAt: null };
      mockApi.patch.mockResolvedValue({ data: unreadMessage });

      const result = await messageService.toggleReadStatus('1', false);

      expect(mockApi.patch).toHaveBeenCalledWith('/messages/1/read', { isRead: false });
      expect(result.isRead).toBe(false);
      expect(result.readAt).toBeNull();
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch the unread message count', async () => {
      mockApi.get.mockResolvedValue({ data: { count: 5 } });

      const result = await messageService.getUnreadCount();

      expect(mockApi.get).toHaveBeenCalledWith('/messages/unread-count');
      expect(result).toBe(5);
    });

    it('should return 0 when there are no unread messages', async () => {
      mockApi.get.mockResolvedValue({ data: { count: 0 } });

      const result = await messageService.getUnreadCount();

      expect(mockApi.get).toHaveBeenCalledWith('/messages/unread-count');
      expect(result).toBe(0);
    });
  });

  describe('getMessageRecipients', () => {
    it('should fetch possible message recipients', async () => {
      const mockRecipients = [
        {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'ADMIN'
        },
        {
          id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'USER'
        }
      ];
      mockApi.get.mockResolvedValue({ data: mockRecipients });

      const result = await messageService.getMessageRecipients();

      expect(mockApi.get).toHaveBeenCalledWith('/messages/recipients');
      expect(result).toEqual(mockRecipients);
      expect(result).toHaveLength(2);
    });
  });
});
