import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { requestNotificationPermissions, getUnreadCount } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    if (user) {
      setupNotifications();
      startPolling();
    } else {
      stopPolling();
      setUnreadCount(0);
    }
    return () => stopPolling();
  }, [user]);

  const setupNotifications = async () => {
    await requestNotificationPermissions();
    await refreshUnreadCount();
  };

  const refreshUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch { /* silent fail */ }
  };

  const startPolling = () => {
    stopPolling();
    // Poll every 30 seconds for new notifications
    pollRef.current = setInterval(refreshUnreadCount, 30000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
