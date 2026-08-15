import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authRequest } from './api';

// ─── Configure foreground notification display ────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Permissions ──────────────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn('Notification permissions error:', e.message);
    return false;
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const getNotifications = () => authRequest('/notifications');
export const getUnreadCount = () => authRequest('/notifications/unread-count');
export const markRead = (id) => authRequest(`/notifications/${id}/read`, { method: 'PATCH' });
export const markAllRead = () => authRequest('/notifications/read-all', { method: 'PATCH' });

// ─── Fire a local push notification immediately ───────────────────────────────
export async function sendLocalNotification(title, body, data = {}) {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      console.warn('Notification permission not granted');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    console.warn('Local notification error:', e.message);
  }
}

// ─── Set up Android notification channel ─────────────────────────────────────
export async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'CleanConnect+ Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E7D32',
        sound: true,
      });
      await Notifications.setNotificationChannelAsync('truck', {
        name: 'Truck Nearby Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FFC107',
        sound: true,
      });
    } catch (e) {
      console.warn('Android channel setup error:', e.message);
    }
  }
}

// ─── Truck nearby alert (called from LiveTracking when distance updates) ─────
let lastAlertDistance = null; // prevent spamming
export async function sendTruckNearbyAlert(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) return;

  if (distanceKm <= 0.5) {
    // Only alert once per "approaching" event
    if (lastAlertDistance === null || lastAlertDistance > 0.5) {
      lastAlertDistance = distanceKm;
      await sendLocalNotification(
        '🚛 Truck is Almost Here!',
        'The garbage collection truck is less than 500m away. Please have your bin ready at the gate!',
        { type: 'truck_nearby', distance: distanceKm }
      );
    }
  } else if (distanceKm <= 1.5) {
    if (lastAlertDistance === null || lastAlertDistance > 1.5) {
      lastAlertDistance = distanceKm;
      await sendLocalNotification(
        '🚛 Truck Nearby',
        `The garbage truck is about ${Math.round(distanceKm * 1000)}m away. Get ready!`,
        { type: 'truck_nearby', distance: distanceKm }
      );
    }
  } else {
    // Reset the alert state when truck moves away
    lastAlertDistance = null;
  }
}

// ─── Manual test notification (for dev/debug) ─────────────────────────────────
export async function sendTestNotification() {
  await sendLocalNotification(
    '🚛 Test: Truck Nearby Alert',
    'This is a test notification from CleanConnect+. Truck is 300m away!',
    { type: 'test' }
  );
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Cancel notifications error:', e.message);
  }
}
