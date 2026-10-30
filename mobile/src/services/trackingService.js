import { io } from 'socket.io-client';
import { SOCKET_URL, authRequest } from './api';

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    socket.on('connect', () => console.log('Socket.IO connected:', socket.id));
    socket.on('disconnect', () => console.log('Socket.IO disconnected'));
    socket.on('connect_error', (err) => console.warn('Socket.IO error:', err.message));
  } else if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

// ─── Citizen: subscribe to vehicle location updates ──────────────────────────
export function subscribeToVehicle(vehicleId, onUpdate, onError) {
  const s = getSocket();
  const join = () => {
    if (vehicleId) s.emit('tracking:join', vehicleId);
  };

  if (s.connected) {
    join();
  }
  s.on('connect', join);
  s.on('tracking:updated', onUpdate);

  return () => {
    s.off('connect', join);
    s.off('tracking:updated', onUpdate);
  };
}

// ─── Driver: broadcast GPS position ──────────────────────────────────────────
export function broadcastDriverLocation(vehicleId, coords) {
  const s = getSocket();
  s.emit('tracking:update', { vehicleId, ...coords, timestamp: new Date().toISOString() });
}

// ─── Driver: join driver notification room ────────────────────────────────────
export function joinDriverRoom(driverId) {
  const s = getSocket();
  s.emit('driver:join', driverId);
}

// ─── REST fallback ────────────────────────────────────────────────────────────
export const getVehicleLocation = (vehicleId) => authRequest(`/tracking/${vehicleId}`);

// ─── Disconnect ───────────────────────────────────────────────────────────────
export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
