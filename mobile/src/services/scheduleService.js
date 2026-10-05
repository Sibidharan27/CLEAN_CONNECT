import { authRequest } from './api';

// ─── Citizen: get collection schedules ───────────────────────────────────────
export const getSchedules = (zone) =>
  authRequest(`/schedules${zone ? `?zone=${encodeURIComponent(zone)}` : ''}`);

export const getUpcomingCollections = () => authRequest('/schedules/upcoming');

// ─── Driver: get today's route ────────────────────────────────────────────────
export const getDriverRoutes = () => authRequest('/driver/routes');

export const startRoute = (routeId) =>
  authRequest(`/driver/routes/${routeId}/start`, { method: 'POST' });

export const completeStop = (routeId, stopId) =>
  authRequest(`/driver/routes/${routeId}/stops/${stopId}/complete`, { method: 'POST' });

export const getDriverStats = () => authRequest('/driver/stats');

// ─── Driver: update GPS location ─────────────────────────────────────────────
// vehicleId should always be passed from the driver's user profile (user.vehicleId)
// The backend will also fall back to req.user.vehicleId if omitted
export const postDriverLocation = (latitude, longitude, vehicleId, heading = 0, speed = 0) =>
  authRequest('/driver/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, vehicleId, heading, speed }),
  });
