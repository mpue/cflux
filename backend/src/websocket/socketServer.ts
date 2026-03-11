import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

let io: Server | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
}

// Map userId -> Set of socketIds (user can have multiple tabs)
const onlineUsers = new Map<string, Set<string>>();

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function initSocketServer(server: HttpServer, allowedOrigins: string[]) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: UserRole;
      };
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`[WS] User connected: ${userId} (socket ${socket.id})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // Broadcast online status
    io!.emit('user:online', { userId });

    // Handle joining a chat room
    socket.on('chat:join', (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    // Handle leaving a chat room
    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    // Handle typing indicator
    socket.on('chat:typing', (data: { roomId: string }) => {
      socket.to(`room:${data.roomId}`).emit('chat:typing', {
        roomId: data.roomId,
        userId,
      });
    });

    socket.on('chat:stop-typing', (data: { roomId: string }) => {
      socket.to(`room:${data.roomId}`).emit('chat:stop-typing', {
        roomId: data.roomId,
        userId,
      });
    });

    // Request online users list
    socket.on('users:online', () => {
      socket.emit('users:online-list', Array.from(onlineUsers.keys()));
    });

    socket.on('disconnect', () => {
      console.log(`[WS] User disconnected: ${userId} (socket ${socket.id})`);
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io!.emit('user:offline', { userId });
        }
      }
    });
  });

  console.log('[WS] Socket.IO server initialized');
  return io;
}

// Emit to a specific user (all their sockets/tabs)
export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Emit to a chat room
export function emitToRoom(roomId: string, event: string, data: any) {
  if (io) {
    io.to(`room:${roomId}`).emit(event, data);
  }
}

// Check if user is online
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
