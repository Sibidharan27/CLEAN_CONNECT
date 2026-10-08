import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authRequest } from './api';

// ─── Configure foreground notification display ────────────────────────────────
// Only use supported properties — shouldShowBanner/shouldShowList are not
// valid across all Expo SDK versions and cause silent failures on Android.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  // Silent fallback for restricted environments
}

// ─── Android channel setup (idempotent — safe to call multiple times) ────────
let _channelsReady = false;
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  if (_channelsReady) return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CleanConnect+ Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E7D32',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('truck', {
      name: 'Truck Nearby Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FFC107',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('complaints', {
      name: 'Complaint Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    _channelsReady = true;
  } catch (e) {
    // Channel setup optional on some emulators — non-fatal
    console.warn('Android channel setup failed:', e.message);
  }
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
    return false;
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────
export const getNotifications = () => authRequest('/notifications').catch(() => []);
export const getUnreadCount = () => authRequest('/notifications/unread-count').catch(() => ({ count: 0 }));
export const markRead = (id) => authRequest(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => ({}));
export const markAllRead = () => authRequest('/notifications/read-all', { method: 'PATCH' }).catch(() => ({}));

// ─── Fire a local push notification immediately ───────────────────────────────
export async function sendLocalNotification(title, body, data = {}, channelId = 'default') {
  try {
    if (Platform.OS === 'web') return;

    // Ensure Android channels are ready before sending
    if (Platform.OS === 'android') {
      await setupAndroidChannel();
    }

    const granted = await requestNotificationPermissions();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    // Suppress notification scheduler errors in dev/emulator
    console.warn('sendLocalNotification error:', e.message);
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
        { type: 'truck_nearby', distance: distanceKm },
        'truck'
      );
    }
  } else if (distanceKm <= 1.5) {
    if (lastAlertDistance === null || lastAlertDistance > 1.5) {
      lastAlertDistance = distanceKm;
      await sendLocalNotification(
        '🚛 Truck Nearby',
        `The garbage truck is about ${Math.round(distanceKm * 1000)}m away. Get ready!`,
        { type: 'truck_nearby', distance: distanceKm },
        'truck'
      );
    }
  } else {
    lastAlertDistance = null;
  }
}

// ─── Complaint status update notification ─────────────────────────────────────
export async function sendComplaintUpdateNotification(title, body) {
  await sendLocalNotification(title, body, { type: 'complaint_update' }, 'complaints');
}

// ─── Collection schedule notification ────────────────────────────────────────
export async function sendCollectionNotification(title, body) {
  await sendLocalNotification(title, body, { type: 'collection_schedule' }, 'default');
}

// ─── Manual test notification (for dev/debug) ─────────────────────────────────
export async function sendTestNotification() {
  await sendLocalNotification(
    '🚛 Test: Truck Nearby Alert',
    'This is a test notification from CleanConnect+. Truck is 300m away!',
    { type: 'test' },
    'truck'
  );
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Non-fatal
  }
}
