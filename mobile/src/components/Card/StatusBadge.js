import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, textStyles, BorderRadius, Spacing } from '../../theme';

const STATUS_CONFIG = {
  Pending: { bg: Colors.statusPendingSurface, text: Colors.statusPending, dot: Colors.statusPending, label: 'Pending' },
  'In Progress': { bg: Colors.statusInProgressSurface, text: Colors.statusInProgress, dot: Colors.statusInProgress, label: 'In Progress' },
  Completed: { bg: Colors.statusCompletedSurface, text: Colors.statusCompleted, dot: Colors.statusCompleted, label: 'Completed' },
  Rejected: { bg: Colors.statusRejectedSurface, text: Colors.statusRejected, dot: Colors.statusRejected, label: 'Rejected' },
  Today: { bg: Colors.accentLight, text: Colors.accentDark, dot: Colors.accent, label: 'Today' },
  Upcoming: { bg: Colors.infoSurface, text: Colors.info, dot: Colors.info, label: 'Upcoming' },
  'On Route': { bg: Colors.infoSurface, text: Colors.info, dot: Colors.info, label: 'On Route' },
  Active: { bg: Colors.successSurface, text: Colors.success, dot: Colors.success, label: 'Active' },
  Offline: { bg: Colors.surfaceVariant, text: Colors.textSecondary, dot: Colors.textTertiary, label: 'Offline' },
};

const StatusBadge = ({ status, size = 'medium', showDot = true, style }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: config.dot }, isSmall && styles.dotSmall]} />
      )}
      <Text style={[styles.text, { color: config.text }, isSmall && styles.textSmall]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotSmall: {
    width: 5,
    height: 5,
    marginRight: 4,
  },
  text: {
    ...textStyles.labelSmall,
    fontFamily: 'Poppins_600SemiBold',
  },
  textSmall: {
    fontSize: 10,
  },
});

export default StatusBadge;
