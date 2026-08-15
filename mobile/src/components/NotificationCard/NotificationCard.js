import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';

const NotificationCard = ({ notification, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.card, !notification.isRead && styles.unreadCard, Shadows.sm, style]}
      onPress={() => onPress && onPress(notification)}
      activeOpacity={0.88}
    >
      {!notification.isRead && <View style={styles.unreadDot} />}
      <View style={[styles.iconBg, { backgroundColor: notification.color + '20' }]}>
        <MaterialCommunityIcons name={notification.icon} size={22} color={notification.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.time}>{notification.time}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    position: 'relative',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  unreadCard: {
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    ...textStyles.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: { ...textStyles.caption, color: Colors.textTertiary },
  message: {
    ...textStyles.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

export default NotificationCard;
