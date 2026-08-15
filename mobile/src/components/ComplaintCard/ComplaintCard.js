import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import StatusBadge from '../Card/StatusBadge';

const ComplaintCard = ({ complaint, onPress, style }) => {
  const iconMap = {
    'Overflowing Bin': 'trash-can-outline',
    'Illegal Dumping': 'alert-circle-outline',
    'Missed Collection': 'truck-remove-outline',
    'Damaged Infrastructure': 'wrench-outline',
    'Foul Odor': 'weather-windy',
    Other: 'help-circle-outline',
  };

  const icon = complaint.categoryIcon || iconMap[complaint.category] || 'alert-circle-outline';

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.md, style]}
      onPress={() => onPress && onPress(complaint)}
      activeOpacity={0.88}
    >
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={22} color={Colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{complaint.title}</Text>
          <Text style={styles.id}>{complaint.id}</Text>
        </View>
        <StatusBadge status={complaint.status} size="small" />
      </View>

      <Text style={styles.description} numberOfLines={2}>{complaint.description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.metaText} numberOfLines={1}>{complaint.area}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.metaText}>{complaint.date}</Text>
        </View>
      </View>

      {complaint.assignedDriver && (
        <View style={styles.driverRow}>
          <MaterialCommunityIcons name="account-outline" size={13} color={Colors.primaryLight} />
          <Text style={styles.driverText}>Assigned: {complaint.assignedDriver}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleBlock: { flex: 1, marginRight: Spacing.sm },
  title: { ...textStyles.labelLarge, color: Colors.textPrimary },
  id: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 2 },
  description: {
    ...textStyles.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  metaText: {
    ...textStyles.caption,
    color: Colors.textTertiary,
    marginLeft: 3,
    flex: 1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  driverText: {
    ...textStyles.caption,
    color: Colors.primaryLight,
    marginLeft: 4,
    fontFamily: 'Poppins_500Medium',
  },
});

export default ComplaintCard;
