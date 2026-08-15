import AsyncStorage from '@react-native-async-storage/async-storage';
import { request, authRequest } from './api';

const TOKEN_KEY = '@cleanconnect:token';
const USER_KEY = '@cleanconnect:user';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const storeToken = (token) => AsyncStorage.setItem(TOKEN_KEY, token);
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const removeToken = () => AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

// ─── Auth API calls ───────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await storeToken(data.token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function register(name, email, password, role = 'citizen') {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
  await storeToken(data.token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function getMe() {
  const data = await authRequest('/auth/me');
  // /api/auth/me returns {token, user} like login
  return data.user || data;
}

export async function getCachedUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function updatePushToken(expoPushToken) {
  try {
    await authRequest('/auth/push-token', {
      method: 'PATCH',
      body: JSON.stringify({ expoPushToken }),
    });
  } catch (e) {
    console.warn('Failed to store push token:', e.message);
  }
}
