import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, getMe, removeToken, getCachedUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true on start while restoring session

  // ─── Restore session on app start ──────────────────────────────────────────
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('@cleanconnect:token');
      if (!token) { setIsLoading(false); return; }

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
      setIsLoading(false);
    }
  };

  // ─── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Register ───────────────────────────────────────────────────────────────
  const register = async (name, email, password, role = 'citizen') => {
    setIsLoading(true);
    try {
      const data = await apiRegister(name, email, password, role);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
