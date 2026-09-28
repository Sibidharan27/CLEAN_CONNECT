import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import VehicleCard from '../../components/VehicleCard/VehicleCard';
import { subscribeToVehicle, getVehicleLocation } from '../../services/trackingService';
import { useLocation } from '../../context/LocationContext';
import { sendTruckNearbyAlert } from '../../services/notificationService';

const { height } = Dimensions.get('window');
const VEHICLE_ID = 'GCT-001';

// Default to Peelamedu center (street-level view)
const PEELAMEDU_DEFAULT = { latitude: 11.0240, longitude: 77.0150 };

const LiveTracking = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { location: myLocation, getCurrentLocation, isLocating } = useLocation();

  const [isTracking, setIsTracking] = useState(true);
  const [truckData, setTruckData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('—');
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState('—');
  const [mapReady, setMapReady] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const unsubRef = useRef(null);

  // Request location on mount if not yet available
  useEffect(() => {
    if (!myLocation) {
      getCurrentLocation().catch((e) => {
        setLocationError('Could not get your location. Showing default area.');
      });
    }

    // Load initial truck position from REST fallback
    getVehicleLocation(VEHICLE_ID)
      .then(data => { if (data) handleTruckUpdate(data); })
      .catch(() => {});

    // Subscribe to real-time Socket.IO updates
    unsubRef.current = subscribeToVehicle(VEHICLE_ID, handleTruckUpdate);

    // Pulse animation for markers
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const handleTruckUpdate = useCallback((data) => {
    setTruckData(data);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

    if (myLocation && data?.latitude && data?.longitude) {
      const dist = calculateDistance(
        myLocation.latitude, myLocation.longitude,
        data.latitude, data.longitude
      );
      setDistance(dist);
      const etaMins = Math.round((dist / 20) * 60);
      setEta(etaMins < 1 ? '< 1 min' : `${etaMins} min`);
      sendTruckNearbyAlert(dist);
    }

    // Animate map to fit both markers
    if (mapRef.current && myLocation && data?.latitude) {
      try {
        mapRef.current.fitToCoordinates(
          [
            { latitude: myLocation.latitude, longitude: myLocation.longitude },
            { latitude: data.latitude, longitude: data.longitude },
          ],
          { edgePadding: { top: 80, right: 60, bottom: 250, left: 60 }, animated: true }
        );
      } catch {}
    }
  }, [myLocation]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const userCoords = myLocation
    ? { latitude: myLocation.latitude, longitude: myLocation.longitude }
    : PEELAMEDU_DEFAULT;

  const truckCoords = truckData?.latitude
    ? { latitude: truckData.latitude, longitude: truckData.longitude }
    : null;

  const initialRegion = {
    latitude: userCoords.latitude,
    longitude: userCoords.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const truck = truckData ? {
    id: VEHICLE_ID,
    plateNumber: 'TN-38-AB-1234',
    driver: truckData.driverName || 'On Route',
    driverPhone: '+91 98765 43210',
    vehicleType: 'Compactor Truck',
    capacity: '5 Tonnes',
    currentLocation: truckData.address || `${truckData.latitude?.toFixed(4)}°N, ${truckData.longitude?.toFixed(4)}°E`,
    eta,
    distance: distance ? `${distance.toFixed(1)} km` : '—',
    status: 'On Route',
    lastUpdated,
  } : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Real Google Map ── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={!!myLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          onMapReady={() => setMapReady(true)}
          customMapStyle={mapStyle}
        >
          {/* ── Citizen / User marker ── */}
          {myLocation && (
            <Marker
              coordinate={userCoords}
              anchor={{ x: 0.5, y: 0.5 }}
              title="You"
              description="Your current location"
            >
              <View style={styles.citizenMarker}>
                <MaterialCommunityIcons name="home" size={16} color="#fff" />
              </View>
            </Marker>
          )}

          {/* ── Live Truck marker (pulse ring as separate marker) ── */}
          {truckCoords && (
            <Marker
              coordinate={truckCoords}
              anchor={{ x: 0.5, y: 0.5 }}
              title={`Truck ${VEHICLE_ID}`}
              description={`Last updated: ${lastUpdated}`}
            >
              <View style={styles.truckMarker}>
                <MaterialCommunityIcons name="truck-fast" size={16} color="#fff" />
              </View>
            </Marker>
          )}

          {/* ── Route Polyline ── */}
          {myLocation && truckCoords && (
            <Polyline
              coordinates={[userCoords, truckCoords]}
              strokeColor={Colors.primary}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>

        {/* ── Locating spinner overlay ── */}
        {isLocating && (
          <View style={styles.locatingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.locatingText}>Getting your location...</Text>
          </View>
        )}

        {/* ── Connecting overlay if no truck data ── */}
        {!truckData && !isLocating && (
          <View style={styles.connectingBanner}>
            <MaterialCommunityIcons name="wifi-strength-1" size={16} color={Colors.textTertiary} />
            <Text style={styles.connectingText}>Connecting to truck GPS...</Text>
          </View>
        )}

        {/* ── Location error banner ── */}
        {locationError && (
          <View style={[styles.connectingBanner, { backgroundColor: Colors.warningSurface }]}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={16} color={Colors.warning} />
            <Text style={[styles.connectingText, { color: Colors.warning }]}>{locationError}</Text>
          </View>
        )}

        {/* ── Top Bar ── */}
        <View style={[styles.mapTopBar, Shadows.md]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.mapTitle}>
            <Text style={styles.mapTitleText}>Live Tracking</Text>
            <View style={styles.liveChip}>
              <View style={[styles.liveDot, truckData && styles.liveDotActive]} />
              <Text style={styles.liveText}>{truckData ? 'LIVE' : 'CONNECTING'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.layersBtn}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: userCoords.latitude,
                  longitude: userCoords.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                });
              }
            }}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom Info Panel ── */}
      <View style={styles.infoPanel}>
        <View style={styles.panelHandle} />

        {/* ETA / Distance / Status row */}
        <View style={styles.etaRow}>
          <View style={styles.etaCard}>
            <MaterialCommunityIcons name="timer-outline" size={24} color={Colors.primary} />
            <Text style={styles.etaValue}>{eta}</Text>
            <Text style={styles.etaLabel}>ETA</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={24} color={Colors.accent} />
            <Text style={[styles.etaValue, { color: Colors.accentDark }]}>
              {distance ? `${distance.toFixed(1)} km` : '—'}
            </Text>
            <Text style={styles.etaLabel}>Distance</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaCard}>
            <MaterialCommunityIcons
              name={truckData ? 'map-marker-check-outline' : 'map-marker-off-outline'}
              size={24}
              color={truckData ? Colors.success : Colors.textTertiary}
            />
            <Text style={[styles.etaValue, { color: truckData ? Colors.success : Colors.textTertiary, fontSize: 12 }]}>
              {truckData ? 'Active' : 'Offline'}
            </Text>
            <Text style={styles.etaLabel}>Truck</Text>
          </View>
        </View>

        {truck && (
          <VehicleCard
            truck={truck}
            style={{ marginHorizontal: Spacing.base, marginBottom: Spacing.sm }}
          />
        )}

        <View style={styles.lastUpdated}>
          <MaterialCommunityIcons name="refresh" size={12} color={Colors.textTertiary} />
          <Text style={styles.lastUpdatedText}>Last updated: {lastUpdated}</Text>
        </View>
      </View>
    </View>
  );
};

// Subtle custom map style (cleaner, less cluttered)
const mapStyle = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 20 }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f2f2f2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f5' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { flex: 1, position: 'relative', minHeight: height * 0.45 },
  map: { flex: 1 },

  // Markers — NO Animated.View inside Marker (unsupported in react-native-maps)
  citizenMarker: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  truckMarker: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },

  // Locating overlay
  locatingOverlay: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: BorderRadius.md, padding: Spacing.sm,
    ...Shadows.sm,
  },
  locatingText: { ...textStyles.caption, color: Colors.primary },

  // Connecting overlay
  connectingBanner: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: BorderRadius.md, padding: Spacing.sm,
    ...Shadows.sm,
  },
  connectingText: { ...textStyles.caption, color: Colors.textTertiary },

  // Top bar
  mapTopBar: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: BorderRadius.lg, padding: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm,
  },
  mapTitle: { flex: 1 },
  mapTitleText: { ...textStyles.labelLarge, color: Colors.textPrimary },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textTertiary },
  liveDotActive: { backgroundColor: Colors.danger },
  liveText: { ...textStyles.caption, color: Colors.textSecondary, fontFamily: 'Poppins_600SemiBold' },
  layersBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySurface, justifyContent: 'center', alignItems: 'center',
  },

  // Bottom panel
  infoPanel: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.sm,
    ...Shadows.xl,
  },
  panelHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  etaRow: {
    flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, marginBottom: Spacing.md,
  },
  etaCard: { alignItems: 'center', flex: 1 },
  etaDivider: { width: 1, backgroundColor: Colors.divider },
  etaValue: { ...textStyles.h5, color: Colors.primary, marginTop: 4 },
  etaLabel: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 2 },
  lastUpdated: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    justifyContent: 'center', paddingBottom: Spacing.base,
  },
  lastUpdatedText: { ...textStyles.caption, color: Colors.textTertiary },
});

export default LiveTracking;
