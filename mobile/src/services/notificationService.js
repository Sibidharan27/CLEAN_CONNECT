import * as Notifications from 'expo-notifications';
import { authRequest } from './api';

// Configure how notifications appear when app is in foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('setNotificationHandler warning:', e.message);
}

// ─── Permissions ─────────────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn('Notification permissions warning:', e.message);
    return false;
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const getNotifications = () => authRequest('/notifications');
export const getUnreadCount = () => authRequest('/notifications/unread-count');
export const markRead = (id) => authRequest(`/notifications/${id}/read`, { method: 'PATCH' });
export const markAllRead = () => authRequest('/notifications/read-all', { method: 'PATCH' });

// ─── Local push notifications ─────────────────────────────────────────────────
export async function scheduleLocalNotification(title, body, seconds = 1) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: seconds <= 1 ? null : { seconds },
    });
  } catch (e) {
    console.warn('Local notification failed:', e.message);
  }
}

export async function sendTruckNearbyAlert(distanceKm) {
  if (distanceKm <= 0.5) {
    await scheduleLocalNotification(
      '🚛 Truck is Almost Here!',
      'The garbage collection truck is less than 500m away. Please have your bin ready!',
    );
  } else if (distanceKm <= 1) {
    await scheduleLocalNotification(
      '🚛 Truck Nearby',
      `The garbage truck is about ${Math.round(distanceKm * 1000)}m away.`,
    );
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Cancel notifications warning:', e.message);
  }
}
