import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import StatusBadge from '../Card/StatusBadge';

const VehicleCard = ({ truck, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.card, Shadows.lg, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.vehicleIconBg}>
            <MaterialCommunityIcons name="truck-fast" size={28} color={Colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.plateNumber}>{truck.plateNumber}</Text>
            <Text style={styles.vehicleType}>{truck.vehicleType}</Text>
          </View>
          <StatusBadge status={truck.status} size="small" />
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="timer-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{truck.eta}</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{truck.distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="account-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue} numberOfLines={1}>{truck.driver.split(' ')[0]}</Text>
            <Text style={styles.statLabel}>Driver</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.location}>{truck.currentLocation}</Text>
          <Text style={styles.updated}>{truck.lastUpdated}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  vehicleIconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: { flex: 1 },
  plateNumber: {
    ...textStyles.h6,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  vehicleType: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  stat: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: {
    ...textStyles.h6,
    color: Colors.textInverse,
    marginTop: 4,
  },
  statLabel: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
    marginLeft: 4,
  },
  updated: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default VehicleCard;
