import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';

// Default center — Coimbatore
const COIMBATORE = { latitude: 11.0168, longitude: 76.9558 };

const MapCard = ({
  title,
  subtitle,
  height = 180,
  onPress,
  style,
  stops = [],       // array of { latitude, longitude, stopNumber, status }
  centerCoord = null, // { latitude, longitude } — center the map here
}) => {
  const center = centerCoord || COIMBATORE;

  const validStops = stops.filter(s => s && s.latitude && s.longitude);
  const routeCoords = validStops.map(s => ({ latitude: s.latitude, longitude: s.longitude }));

  const initialRegion = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: stops.length > 2 ? 0.06 : 0.015,
    longitudeDelta: stops.length > 2 ? 0.06 : 0.015,
  };

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.md, { height }, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Real Google Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        customMapStyle={mapStyle}
        pointerEvents="none"
      >
        {/* Route line connecting stops */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[6, 3]}
          />
        )}

        {/* Stop markers */}
        {stops.map((stop, i) => {
          if (!stop.latitude || !stop.longitude) return null;
          const isCompleted = stop.status === 'completed';
          return (
            <Marker
              key={stop._id || i}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[
                styles.stopPin,
                isCompleted ? styles.stopPinDone : styles.stopPinPending,
              ]}>
                {isCompleted ? (
                  <MaterialCommunityIcons name="check" size={9} color="#fff" />
                ) : (
                  <Text style={styles.stopPinNum}>{stop.stopNumber || i + 1}</Text>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Overlay info */}
      {(title || subtitle) && (
        <View style={styles.overlay}>
          <View style={styles.info}>
            <MaterialCommunityIcons name="map-marker" size={16} color={Colors.primary} />
            <View style={{ marginLeft: 6 }}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          <View style={styles.expandBtn}>
            <MaterialCommunityIcons name="arrow-expand" size={16} color={Colors.primary} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Clean, minimal map style
const mapStyle = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f2f2f2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 15 }] },
];

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#E8F4FD',
  },
  map: { flex: 1 },

  stopPin: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2,
    elevation: 3,
  },
  stopPinPending: { backgroundColor: Colors.info },
  stopPinDone: { backgroundColor: Colors.success },
  stopPinNum: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#fff' },

  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { ...textStyles.label, color: Colors.textPrimary },
  subtitle: { ...textStyles.caption, color: Colors.textSecondary },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapCard;
