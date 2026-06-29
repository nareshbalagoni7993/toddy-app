import { io } from 'socket.io-client';
import { BASE_URL } from './api';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function connectSocket(user) {
  const s = getSocket();
  if (!s.connected) s.connect();

  // Join personal room after connection
  s.on('connect', () => {
    if (user?.role === 'super_admin') {
      s.emit('join_super_admin');
    } else if (user?.id && user?.role) {
      s.emit('join', { role: user.role, id: user.id });
    }
  });

  // Immediately join if already connected
  if (s.connected && user) {
    if (user.role === 'super_admin') {
      s.emit('join_super_admin');
    } else if (user.id && user.role) {
      s.emit('join', { role: user.role, id: user.id });
    }
  }

  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
