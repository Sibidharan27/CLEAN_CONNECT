import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authRequest } from './api';

// ─── Configure foreground notification display (safe across Expo versions) ───
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  // Silent fallback for environments where NotificationHandler is restricted
}

// ─── Permissions ──────────────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  try {
    if (Platform.OS === 'web') return false;

    const { status: existing } = await Notifications.getPermissionsAsync().catch(() => ({ status: 'undetermined' }));
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    }).catch(() => ({ status: 'denied' }));

    return status === 'granted';
  } catch {
    // Non-fatal error
    return false;
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const getNotifications = () => authRequest('/notifications').catch(() => []);
export const getUnreadCount = () => authRequest('/notifications/unread-count').catch(() => ({ count: 0 }));
export const markRead = (id) => authRequest(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => ({}));
export const markAllRead = () => authRequest('/notifications/read-all', { method: 'PATCH' }).catch(() => ({}));

// ─── Fire a local push notification immediately ───────────────────────────────
export async function sendLocalNotification(title, body, data = {}) {
  try {
    if (Platform.OS === 'web') return;

    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
        ...(Platform.OS === 'android' && { channelId: 'truck' }),
      },
      trigger: null, // fire immediately
    });
  } catch {
    // Suppress notification scheduler errors in dev/emulator
  }
}

// ─── Set up Android notification channels ─────────────────────────────────────
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
    } catch {
      // Channel setup is optional on some Android emulators
    }
  }
}

// ─── Truck nearby alert (called from LiveTracking when distance updates) ─────
let lastAlertDistance = null;
export async function sendTruckNearbyAlert(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) return;

  if (distanceKm <= 0.5) {
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
  } catch {
    // Non-fatal
  }
}
