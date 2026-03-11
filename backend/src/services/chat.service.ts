import { PrismaClient } from '@prisma/client';
import { emitToRoom, emitToUser } from '../websocket/socketServer';

const prisma = new PrismaClient();

// Get or create a direct chat room between two users
export async function getOrCreateDirectRoom(userId1: string, userId2: string) {
  // Find existing direct room with both users
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { members: { some: { userId: userId1 } } },
        { members: { some: { userId: userId2 } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
      },
    },
  });

  if (existingRoom) return existingRoom;

  // Create new direct room
  return prisma.chatRoom.create({
    data: {
      type: 'DIRECT',
      members: {
        create: [{ userId: userId1 }, { userId: userId2 }],
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
      },
    },
  });
}

// Create a group chat room
export async function createGroupRoom(name: string, memberIds: string[]) {
  return prisma.chatRoom.create({
    data: {
      name,
      type: 'GROUP',
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
      },
    },
  });
}

// Get all chat rooms for a user
export async function getUserRooms(userId: string) {
  const rooms = await prisma.chatRoom.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Add unread count for each room
  const roomsWithUnread = await Promise.all(
    rooms.map(async (room) => {
      const membership = await prisma.chatRoomMember.findUnique({
        where: { roomId_userId: { roomId: room.id, userId } },
      });
      const unreadCount = await prisma.chatMessage.count({
        where: {
          roomId: room.id,
          createdAt: { gt: membership?.lastReadAt || new Date(0) },
          senderId: { not: userId },
        },
      });
      return { ...room, unreadCount };
    })
  );

  return roomsWithUnread;
}

// Get messages for a room (paginated)
export async function getRoomMessages(roomId: string, cursor?: string, limit = 50) {
  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
    },
  });

  return messages.reverse();
}

// Send a chat message
export async function sendChatMessage(roomId: string, senderId: string, content: string) {
  const message = await prisma.chatMessage.create({
    data: { roomId, senderId, content },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
    },
  });

  // Update room updatedAt
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { updatedAt: new Date() },
  });

  // Mark as read for sender
  await prisma.chatRoomMember.update({
    where: { roomId_userId: { roomId, userId: senderId } },
    data: { lastReadAt: new Date() },
  });

  // Emit to room via WebSocket
  emitToRoom(roomId, 'chat:message', message);

  // Create notifications for other members
  const members = await prisma.chatRoomMember.findMany({
    where: { roomId, userId: { not: senderId } },
  });

  for (const member of members) {
    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: member.userId,
        type: 'CHAT_MESSAGE',
        title: `Neue Nachricht von ${message.sender.firstName} ${message.sender.lastName}`,
        body: content.length > 100 ? content.substring(0, 100) + '...' : content,
        linkUrl: `/chat/${roomId}`,
      },
    });

    // Push notification to user via WebSocket
    emitToUser(member.userId, 'notification:new', notification);
  }

  return message;
}

// Mark messages as read
export async function markRoomAsRead(roomId: string, userId: string) {
  await prisma.chatRoomMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { lastReadAt: new Date() },
  });
}

// Get total unread chat count for a user
export async function getUnreadChatCount(userId: string) {
  const memberships = await prisma.chatRoomMember.findMany({
    where: { userId },
  });

  let total = 0;
  for (const m of memberships) {
    const count = await prisma.chatMessage.count({
      where: {
        roomId: m.roomId,
        createdAt: { gt: m.lastReadAt },
        senderId: { not: userId },
      },
    });
    total += count;
  }
  return total;
}
