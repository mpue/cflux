import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Determine backend URL
    const electronBackendUrl = (window as any).ELECTRON_BACKEND_URL;
    const backendUrl = electronBackendUrl || 
      (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : '');

    const newSocket = io(backendUrl || window.location.origin, {
      auth: { token },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 20,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('users:online');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('users:online-list', (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    newSocket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
