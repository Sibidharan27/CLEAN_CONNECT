import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import { getNotifications, markRead, markAllRead } from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_ICONS = {
  complaint: 'clipboard-check-outline',
  schedule: 'calendar-check',
  tracking: 'truck-fast',
  general: 'bell-outline',
};

const TYPE_COLORS = {
  complaint: Colors.info,
  schedule: Colors.success,
  tracking: Colors.warning,
  general: Colors.primary,
};

const NotificationItem = ({ item, onRead }) => {
  const isRead = !!item.readAt;
  const icon = TYPE_ICONS[item.type] || 'bell-outline';
  const color = TYPE_COLORS[item.type] || Colors.primary;
  const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <TouchableOpacity
      style={[styles.notifCard, Shadows.sm, isRead && styles.notifCardRead]}
      onPress={() => !isRead && onRead(item._id)}
      activeOpacity={0.85}
    >
      <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, isRead && styles.notifTitleRead]} numberOfLines={1}>{item.title}</Text>
          {!isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
};

const Notifications = ({ navigation }) => {
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.warn('Notifications load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, []);

  const onRefresh = () => { setRefreshing(true); loadNotifications(); };

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readAt: new Date() } : n));
      await refreshUnreadCount();
    } catch (e) { console.warn('Mark read error:', e.message); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date() })));
      await refreshUnreadCount();
    } catch (e) { console.warn('Mark all read error:', e.message); }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-sleep-outline" size={60} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>You have no notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          renderItem={({ item }) => <NotificationItem item={item} onRead={handleMarkRead} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  markAllBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  markAllText: { ...textStyles.label, color: Colors.primary },
  listContent: { padding: Spacing.base, paddingBottom: 80 },
  notifCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifCardRead: { opacity: 0.65, borderLeftColor: Colors.border },
  iconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { ...textStyles.labelLarge, color: Colors.textPrimary, flex: 1 },
  notifTitleRead: { fontFamily: 'Poppins_400Regular' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 8 },
  notifBody: { ...textStyles.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
  notifTime: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...textStyles.h5, color: Colors.textPrimary, marginTop: Spacing.base },
  emptySubtitle: { ...textStyles.body, color: Colors.textSecondary, marginTop: Spacing.sm },
});

export default Notifications;
