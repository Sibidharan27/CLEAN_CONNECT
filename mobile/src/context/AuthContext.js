import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, getMe, removeToken, getCachedUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true); // true ONLY on app start while checking token

  // ─── Restore session on app start ──────────────────────────────────────────
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('@cleanconnect:token');
      if (!token) { setIsRestoring(false); return; }

      // Verify token is still valid — getMe returns the full user object
      const userData = await getMe();
      // Cache fresh user data with all fields
      await AsyncStorage.setItem('@cleanconnect:user', JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      // Token expired or invalid — clear it
      await removeToken();
      setUser(null);
    } finally {
      setIsRestoring(false);
    }
  };

  // ─── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  };

  // ─── Register ───────────────────────────────────────────────────────────────
  const register = async (name, email, password, role = 'citizen', phone = '', area = '') => {
    const data = await apiRegister(name, email, password, role, phone, area);
    setUser(data.user);
    return data;
  };

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, isRestoring, isLoading: isRestoring, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
