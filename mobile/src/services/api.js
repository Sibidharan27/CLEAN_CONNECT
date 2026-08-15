import AsyncStorage from '@react-native-async-storage/async-storage';

// Auto-detect API URL: prefer env var, fallback to current Wi-Fi IP
const FALLBACK_IP = '172.20.10.7';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('localhost')
    ? process.env.EXPO_PUBLIC_API_URL
    : `http://${FALLBACK_IP}:5000/api`;

export const SOCKET_URL = API_URL.replace('/api', '');

// ─── Unauthenticated request ─────────────────────────────────────────────────
export async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Cannot reach server at ${API_URL}. Check network connection.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Authenticated JSON request ───────────────────────────────────────────────
export async function authRequest(path, options = {}) {
  const token = await AsyncStorage.getItem('@cleanconnect:token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Cannot reach server at ${API_URL}. Check network connection.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Authenticated multipart/form-data request ───────────────────────────────
export async function uploadRequest(path, formData) {
  const token = await AsyncStorage.getItem('@cleanconnect:token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Upload timed out. Check network connection.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
