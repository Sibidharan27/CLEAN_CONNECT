import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ActivityIndicator, ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { subscribeToVehicle, getVehicleLocation } from '../../services/trackingService';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { sendTruckNearbyAlert } from '../../services/notificationService';
import { getHaversineDistance } from '../../services/roadRoutingService';
import { PEELAMEDU_ZONES, getZoneForStreet } from '../../constants/zonesData';

const LiveTracking = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();
  const { location: myLocation, getCurrentLocation, isLocating } = useLocation();

  // Identify citizen zone
  const citizenZone = getZoneForStreet(user?.street || user?.zone);
  const vehicleId = citizenZone.vehicleId || 'GCT-001';
  const streetStops = citizenZone.streets;

  const [truckData, setTruckData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('—');
  const [distanceKm, setDistanceKm] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [activeStopIndex, setActiveStopIndex] = useState(1);
  const unsubRef = useRef(null);

  // Pulse animation for truck marker
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleTruckUpdate = useCallback((data) => {
    setTruckData(data);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

    if (data?.latitude && myLocation) {
      const d = getHaversineDistance(
        { latitude: data.latitude, longitude: data.longitude },
        { latitude: myLocation.latitude, longitude: myLocation.longitude }
      );
      const dKm = +d.toFixed(2);
      setDistanceKm(dKm);
      sendTruckNearbyAlert(dKm);
    }
  }, [myLocation]);

  useEffect(() => {
    if (!myLocation) {
      getCurrentLocation().catch(() => {});
    }

    getVehicleLocation(vehicleId)
      .then(data => { if (data?.latitude) handleTruckUpdate(data); })
      .catch(() => {
        handleTruckUpdate({
          latitude: streetStops[1]?.latitude || citizenZone.center.latitude,
          longitude: streetStops[1]?.longitude || citizenZone.center.longitude,
          driverName: citizenZone.driverName,
          speed: 18,
        });
      });

    unsubRef.current = subscribeToVehicle(vehicleId, handleTruckUpdate);
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [vehicleId]);

  const currentStop = streetStops[activeStopIndex] || streetStops[0];
  const nextStop = streetStops[activeStopIndex + 1] || null;

  const truckCoords = truckData?.latitude
    ? { latitude: truckData.latitude, longitude: truckData.longitude }
    : { latitude: currentStop.latitude, longitude: currentStop.longitude };

  const userCoords = myLocation
    ? { latitude: myLocation.latitude, longitude: myLocation.longitude }
    : { latitude: streetStops[0]?.latitude || citizenZone.center.latitude, longitude: streetStops[0]?.longitude || citizenZone.center.longitude };

  const initialRegion = {
    latitude: truckCoords.latitude,
    longitude: truckCoords.longitude,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  const completedCount = activeStopIndex;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, Shadows.md]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>{citizenZone.name}</Text>
          <View style={styles.liveChip}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>{vehicleId} • {citizenZone.driverName} LIVE</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                ...truckCoords,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              });
            }
          }}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── View Toggle ── */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          onPress={() => setViewMode('map')}
        >
          <MaterialCommunityIcons name="map-outline" size={16} color={viewMode === 'map' ? '#fff' : Colors.textSecondary} />
          <Text style={[styles.toggleBtnText, viewMode === 'map' && styles.toggleBtnTextActive]}>Live Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'street' && styles.toggleBtnActive]}
          onPress={() => setViewMode('street')}
        >
          <MaterialCommunityIcons name="road-variant" size={16} color={viewMode === 'street' ? '#fff' : Colors.textSecondary} />
          <Text style={[styles.toggleBtnText, viewMode === 'street' && styles.toggleBtnTextActive]}>Zone Streets ({streetStops.length})</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'map' ? (
        /* ── MAP VIEW ── */
        <View style={styles.mapArea}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            customMapStyle={mapStyle}
          >
            {/* All zone street dustbin markers */}
            {streetStops.map((stop, idx) => {
              const isDone = idx < activeStopIndex;
              const isCurrent = idx === activeStopIndex;
              const isNext = idx === activeStopIndex + 1;
              return (
                <Marker
                  key={stop.name + idx}
                  coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                  title={`${stop.name}`}
                  description={`${stop.binType} • ${stop.housesCount} houses • ${isDone ? 'CLEARED' : isCurrent ? 'COLLECTING' : 'PENDING'}`}
                  anchor={{ x: 0.5, y: 0.5 }}
                  zIndex={isCurrent ? 15 : isNext ? 12 : 5}
                  tracksViewChanges={false}
                >
                  <View style={[
                    styles.binPin,
                    isDone && styles.binPinDone,
                    isCurrent && styles.binPinCurrent,
                    isNext && styles.binPinNext,
                  ]}>
                    <MaterialCommunityIcons
                      name={isDone ? 'check' : isCurrent ? 'truck' : 'trash-can-outline'}
                      size={isDone ? 12 : 13}
                      color="#fff"
                    />
                  </View>
                </Marker>
              );
            })}

            {/* Citizen home location marker */}
            <Marker
              coordinate={userCoords}
              title="Your Location"
              description={user?.street ? `${user.street}, Peelamedu` : 'Peelamedu Residence'}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={20}
              tracksViewChanges={true}
            >
              <View style={styles.homePin}>
                <MaterialCommunityIcons name="home" size={16} color="#fff" />
              </View>
            </Marker>

            {/* Live truck marker */}
            <Marker
              coordinate={truckCoords}
              title={`Truck ${vehicleId}`}
              description={`Driver: ${citizenZone.driverName} • ${currentStop.name}`}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={50}
              tracksViewChanges={true}
            >
              <View style={styles.truckPin}>
                <MaterialCommunityIcons name="truck-fast" size={18} color="#fff" />
              </View>
            </Marker>
          </MapView>

          {isLocating && (
            <View style={styles.locatingPill}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.locatingText}>Locating your street in Peelamedu...</Text>
            </View>
          )}

          {/* ── Bottom info panel ── */}
          <View style={styles.bottomPanel}>
            <View style={styles.panelHandle} />

            {/* Info cards row */}
            <View style={styles.etaRow}>
              <View style={styles.etaCard}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color={Colors.info} />
                <Text style={styles.etaValue}>{distanceKm != null ? `${distanceKm} km` : '0.4 km'}</Text>
                <Text style={styles.etaLabel}>Distance</Text>
              </View>
              <View style={styles.etaCard}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.primary} />
                <Text style={styles.etaValue}>
                  {distanceKm != null ? (distanceKm < 0.3 ? '< 5 min' : `~${Math.round(distanceKm * 4)} min`) : '~8 min'}
                </Text>
                <Text style={styles.etaLabel}>Estimated ETA</Text>
              </View>
              <View style={styles.etaCard}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color={Colors.success} />
                <Text style={styles.etaValue}>{completedCount}/{streetStops.length}</Text>
                <Text style={styles.etaLabel}>Streets Done</Text>
              </View>
            </View>

            {/* Current collecting street */}
            <View style={styles.currentBanner}>
              <View style={[styles.bannerDot, { backgroundColor: '#FF8F00' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerLabel}>COLLECTING ON STREET NOW</Text>
                <Text style={styles.bannerStreet}>{currentStop.name}</Text>
                <Text style={styles.bannerAddress} numberOfLines={1}>📍 {currentStop.landmark}</Text>
              </View>
            </View>

            {/* Next street */}
            {nextStop && (
              <View style={styles.nextStopCard}>
                <MaterialCommunityIcons name="map-marker-right" size={18} color="#FF8F00" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.nextStopLabel}>
                    NEXT STREET — {nextStop.name}
                  </Text>
                  <Text style={styles.nextStopAddress} numberOfLines={1}>{nextStop.landmark}</Text>
                </View>
                <View style={styles.nextStopEtaBadge}>
                  <Text style={styles.nextStopEtaText}>~5 min</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* ── STREET-BY-STREET VIEW ── */
        <ScrollView
          style={styles.streetScroll}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.streetHeader}>
            <Text style={styles.streetHeaderTitle}>{citizenZone.name}</Text>
            <Text style={styles.streetHeaderSub}>
              Assigned Vehicle: {vehicleId} • Driver: {citizenZone.driverName}
            </Text>
            <View style={styles.streetProgressPill}>
              <Text style={styles.streetProgressText}>
                {completedCount} of {streetStops.length} streets collected
              </Text>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Zone Street Collection Sequence</Text>

          {streetStops.map((stop, idx) => {
            const isDone = idx < activeStopIndex;
            const isCurrent = idx === activeStopIndex;
            const isNext = idx === activeStopIndex + 1;

            return (
              <View key={stop.name + idx} style={[styles.streetCard, isCurrent && styles.streetCardActive, Shadows.sm]}>
                {/* Step indicator column */}
                <View style={styles.stepCol}>
                  <View style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isCurrent && styles.stepCircleCurrent,
                    isNext && styles.stepCircleNext,
                  ]}>
                    {isDone
                      ? <MaterialCommunityIcons name="check" size={13} color="#fff" />
                      : isCurrent
                        ? <MaterialCommunityIcons name="truck" size={13} color="#fff" />
                        : <Text style={styles.stepNum}>{idx + 1}</Text>
                    }
                  </View>
                  {idx < streetStops.length - 1 && (
                    <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                  )}
                </View>

                {/* Content */}
                <View style={styles.streetContent}>
                  <View style={styles.streetTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.streetName}>{stop.name}</Text>
                      <Text style={styles.streetAddress} numberOfLines={1}>{stop.address}</Text>
                    </View>
                    <View style={[
                      styles.statusChip,
                      isDone ? styles.chipDone : isCurrent ? styles.chipCurrent : isNext ? styles.chipNext : styles.chipPending,
                    ]}>
                      <Text style={[
                        styles.statusChipText,
                        isDone ? { color: Colors.success }
                          : isCurrent ? { color: Colors.primary }
                            : isNext ? { color: '#FF8F00' }
                              : { color: Colors.textTertiary },
                      ]}>
                        {isDone ? 'CLEARED' : isCurrent ? 'COLLECTING' : isNext ? 'NEXT' : 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.streetLandmark}>📍 {stop.landmark}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="trash-can-outline" size={11} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{stop.binType}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="home-outline" size={11} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{stop.housesCount} houses</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const mapStyle = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f5' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapArea: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: Spacing.base,
    marginTop: Spacing.xs, marginBottom: Spacing.xs,
    padding: Spacing.sm, borderRadius: BorderRadius.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm,
  },
  topTitle: { ...textStyles.labelLarge, color: Colors.textPrimary },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: Colors.success },
  recenterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },

  toggleRow: {
    flexDirection: 'row', backgroundColor: '#E8EDF2', borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base, marginBottom: Spacing.xs, padding: 3,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: BorderRadius.sm,
  },
  toggleBtnActive: { backgroundColor: Colors.primary, elevation: 2 },
  toggleBtnText: { ...textStyles.caption, color: Colors.textSecondary, fontFamily: 'Poppins_600SemiBold' },
  toggleBtnTextActive: { color: '#fff' },

  binPin: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.textTertiary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff', elevation: 3,
  },
  binPinDone: { backgroundColor: Colors.success },
  binPinCurrent: { backgroundColor: '#FF8F00', width: 30, height: 30, borderRadius: 15 },
  binPinNext: { backgroundColor: Colors.info },
  homePin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#fff', elevation: 4,
  },
  truckPin: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff', elevation: 6,
  },

  locatingPill: {
    position: 'absolute', top: 80, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, elevation: 5,
  },
  locatingText: { ...textStyles.caption, color: Colors.primary },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.base, paddingBottom: 26, ...Shadows.xl,
  },
  panelHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.divider, alignSelf: 'center', marginBottom: Spacing.sm,
  },

  etaRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  etaCard: {
    flex: 1, backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center',
  },
  etaValue: { ...textStyles.h6, fontSize: 13, color: Colors.textPrimary, marginTop: 2 },
  etaLabel: { ...textStyles.caption, color: Colors.textTertiary, fontSize: 9, textAlign: 'center', marginTop: 1 },

  currentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8E1', borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.xs,
    borderWidth: 1, borderColor: '#FFE082',
  },
  bannerDot: { width: 10, height: 10, borderRadius: 5 },
  bannerLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#FF8F00', letterSpacing: 0.5 },
  bannerStreet: { ...textStyles.label, color: Colors.textPrimary },
  bannerAddress: { ...textStyles.caption, color: Colors.textSecondary },

  nextStopCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '25',
  },
  nextStopLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#FF8F00', letterSpacing: 0.5 },
  nextStopAddress: { ...textStyles.caption, color: Colors.textPrimary },
  nextStopEtaBadge: {
    backgroundColor: '#FF8F00', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  nextStopEtaText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },

  streetScroll: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: Spacing.xs },
  streetHeader: { borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.md },
  streetHeaderTitle: { ...textStyles.h5, color: '#fff' },
  streetHeaderSub: { ...textStyles.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: Spacing.sm },
  streetProgressPill: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start',
  },
  streetProgressText: { ...textStyles.caption, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.sm },

  streetCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  streetCardActive: { borderWidth: 1.5, borderColor: '#FF8F00', backgroundColor: '#FFFDE7' },

  stepCol: { alignItems: 'center', marginRight: 12 },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.textTertiary,
    justifyContent: 'center', alignItems: 'center',
  },
  stepCircleDone: { backgroundColor: Colors.success },
  stepCircleCurrent: { backgroundColor: '#FF8F00', width: 30, height: 30, borderRadius: 15 },
  stepCircleNext: { backgroundColor: Colors.info },
  stepNum: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },
  stepLine: { width: 2, flex: 1, backgroundColor: Colors.borderLight, marginVertical: 3, minHeight: 18 },
  stepLineDone: { backgroundColor: Colors.success + '60' },

  streetContent: { flex: 1 },
  streetTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  streetName: { ...textStyles.labelLarge, color: Colors.textPrimary },
  streetAddress: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 1 },
  statusChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full, marginLeft: 6 },
  chipDone: { backgroundColor: Colors.successSurface },
  chipCurrent: { backgroundColor: '#FFF8E1' },
  chipNext: { backgroundColor: '#FFF3E0' },
  chipPending: { backgroundColor: Colors.surfaceVariant },
  statusChipText: { fontSize: 8, fontFamily: 'Poppins_700Bold' },

  streetLandmark: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 3, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  metaText: { fontSize: 10, color: Colors.textSecondary },
});

export default LiveTracking;
