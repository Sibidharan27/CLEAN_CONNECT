import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  ActivityIndicator, ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { subscribeToVehicle, getVehicleLocation } from '../../services/trackingService';
import { useLocation } from '../../context/LocationContext';
import { sendTruckNearbyAlert } from '../../services/notificationService';
import { getRoadRoute, getNextStopRoute, getMultiStopRoadRoute } from '../../services/roadRoutingService';

const VEHICLE_ID = 'GCT-001';

// ─── Real sequential street stops — placed ON actual roads in Peelamedu ───────
// The truck travels these in order, each stop on a specific street
const STREET_STOPS = [
  {
    id: 'st-1',
    street: 'Avinashi Road',
    address: 'Avinashi Road, Peelamedu Flyover Junction',
    landmark: 'Near Trichy Road flyover junction',
    binType: 'General & Organic',
    fillLevel: 90,
    status: 'completed',
    latitude: 11.0178,
    longitude: 76.9971,
    time: '7:00 AM',
  },
  {
    id: 'st-2',
    street: 'Avinashi Road',
    address: 'Avinashi Road, near Meenakshi Hospital Junction',
    landmark: 'Opposite Meenakshi Hospital signal',
    binType: 'Dry & Recyclables',
    fillLevel: 75,
    status: 'completed',
    latitude: 11.0199,
    longitude: 77.0018,
    time: '7:25 AM',
  },
  {
    id: 'st-3',
    street: 'Peelamedu Main Road',
    address: 'Peelamedu Main Road Junction',
    landmark: 'Avinashi Rd–Peelamedu Main Rd junction',
    binType: 'Commercial Waste',
    fillLevel: 85,
    status: 'current',
    latitude: 11.0217,
    longitude: 77.0055,
    time: 'Now',
  },
  {
    id: 'st-4',
    street: 'Peelamedu Main Road',
    address: 'KG Hospital Road, Peelamedu Main Rd',
    landmark: 'KG Hospital main entrance gate',
    binType: 'Medical & Dry',
    fillLevel: 60,
    status: 'next',
    latitude: 11.0234,
    longitude: 77.0072,
    time: 'In ~5 mins',
  },
  {
    id: 'st-5',
    street: 'PSG College Road',
    address: 'PSG College Road, Peelamedu',
    landmark: 'PSG College Road T-junction',
    binType: 'Residential Waste',
    fillLevel: 70,
    status: 'pending',
    latitude: 11.0248,
    longitude: 77.0030,
    time: '8:30 AM',
  },
  {
    id: 'st-6',
    street: 'GR Damodaran Road',
    address: 'GR Damodaran Academy Road',
    landmark: 'Beside GRD School gate',
    binType: 'Dry Recyclables',
    fillLevel: 50,
    status: 'pending',
    latitude: 11.0269,
    longitude: 77.0054,
    time: '9:00 AM',
  },
  {
    id: 'st-7',
    street: 'Pudur 2nd Cross Street',
    address: 'Pudur 2nd Cross Street, Peelamedu',
    landmark: 'Pudur residential colony',
    binType: 'Residential Waste',
    fillLevel: 65,
    status: 'pending',
    latitude: 11.0254,
    longitude: 77.0112,
    time: '9:30 AM',
  },
  {
    id: 'st-8',
    street: 'Fun Republic Mall Service Lane',
    address: 'Fun Republic Mall Service Lane',
    landmark: 'Fun Republic Mall side service road',
    binType: 'Bulk Commercial Waste',
    fillLevel: 80,
    status: 'pending',
    latitude: 11.0236,
    longitude: 77.0143,
    time: '10:00 AM',
  },
  {
    id: 'st-9',
    street: 'Tidel Park Road',
    address: 'Tidel Park Road, Avinashi Road',
    landmark: 'Tidel Park IT road junction',
    binType: 'Office & Dry Waste',
    fillLevel: 45,
    status: 'pending',
    latitude: 11.0207,
    longitude: 77.0110,
    time: '10:30 AM',
  },
  {
    id: 'st-10',
    street: 'Texvalley Mall Road',
    address: 'Texvalley Mall Road, Avinashi Road',
    landmark: 'Texvalley Shopping Complex entry',
    binType: 'Bulk Waste',
    fillLevel: 55,
    status: 'pending',
    latitude: 11.0196,
    longitude: 77.0223,
    time: '11:00 AM',
  },
];

const CURRENT_STOP = STREET_STOPS.find(s => s.status === 'current') || STREET_STOPS[2];
const NEXT_STOP = STREET_STOPS.find(s => s.status === 'next') || STREET_STOPS[3];

// Default center — Peelamedu zone
const PEELAMEDU = { latitude: 11.0217, longitude: 77.0055 };

const LiveTracking = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { location: myLocation, getCurrentLocation, isLocating } = useLocation();

  const [truckData, setTruckData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('—');
  const [toHomePath, setToHomePath] = useState([]);       // truck → citizen's home (road)
  const [toNextStopPath, setToNextStopPath] = useState([]); // truck → next collection stop (road)
  const [fullRoutePath, setFullRoutePath] = useState([]); // full remaining route polyline
  const [distanceKm, setDistanceKm] = useState(null);
  const [eta, setEta] = useState('—');
  const [nextStopEta, setNextStopEta] = useState('—');
  const [nextStopDist, setNextStopDist] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [locationError, setLocationError] = useState(null);
  const unsubRef = useRef(null);
  const routeComputedRef = useRef(false);

  // Pulse animation for truck marker
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Request location, load truck, subscribe to Socket.IO updates
  useEffect(() => {
    if (!myLocation) {
      getCurrentLocation().catch(() => {
        setLocationError('Showing Peelamedu Zone A route');
      });
    }

    // Try to get live truck GPS first
    getVehicleLocation(VEHICLE_ID)
      .then(data => { if (data?.latitude) handleTruckUpdate(data); })
      .catch(() => {
        // Fallback: place truck at current collection stop
        handleTruckUpdate({
          latitude: CURRENT_STOP.latitude,
          longitude: CURRENT_STOP.longitude,
          driverName: 'Murugan S',
          speed: 18,
        });
      });

    unsubRef.current = subscribeToVehicle(VEHICLE_ID, handleTruckUpdate);
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  // Re-compute routes when myLocation arrives
  useEffect(() => {
    if (myLocation && truckData?.latitude && !routeComputedRef.current) {
      routeComputedRef.current = true;
      computeAllRoutes(truckData, myLocation);
    }
  }, [myLocation, truckData]);

  // Core function: compute three polylines via OSRM roads (queued sequentially to avoid TCP errors)
  const computeAllRoutes = useCallback(async (truck, userLoc) => {
    const truckPt = { latitude: truck.latitude, longitude: truck.longitude };
    const homePt = userLoc
      ? { latitude: userLoc.latitude, longitude: userLoc.longitude }
      : PEELAMEDU;
    const nextPt = { latitude: NEXT_STOP.latitude, longitude: NEXT_STOP.longitude };

    // 1. Truck → Citizen's home (staggered: fire immediately)
    getRoadRoute(truckPt, homePt).then(r => {
      if (r.coordinates.length > 1) {
        setToHomePath(r.coordinates);
        setDistanceKm(r.distanceKm);
        setEta(r.durationMin <= 1 ? '< 1 min' : `${r.durationMin} mins`);
        sendTruckNearbyAlert(r.distanceKm);
      }
    }).catch(() => {});

    // 2. Truck → Next stop (staggered: wait 600ms so queue has space)
    setTimeout(() => {
      getNextStopRoute(truckPt, nextPt).then(r => {
        if (r.coordinates.length > 1) {
          setToNextStopPath(r.coordinates);
          setNextStopDist(r.distanceKm);
          setNextStopEta(r.durationMin <= 1 ? '< 1 min' : `${r.durationMin} mins`);
        }
      }).catch(() => {});
    }, 600);

    // 3. Full remaining multi-stop route (staggered: wait 1200ms — lowest priority)
    setTimeout(() => {
      const pendingStops = STREET_STOPS.filter(s => s.status !== 'completed')
        .map(s => ({ latitude: s.latitude, longitude: s.longitude }));
      if (pendingStops.length > 1) {
        getMultiStopRoadRoute([truckPt, ...pendingStops]).then(coords => {
          if (coords.length > 1) setFullRoutePath(coords);
        }).catch(() => {});
      }
    }, 1200);
  }, []);

  const handleTruckUpdate = useCallback((data) => {
    setTruckData(data);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    if (data?.latitude && myLocation) {
      routeComputedRef.current = false; // allow recompute
      computeAllRoutes(data, myLocation);
    }
    // Map stays where the user left it — no automatic recentering
  }, [myLocation, computeAllRoutes]);

  const truckCoords = truckData?.latitude
    ? { latitude: truckData.latitude, longitude: truckData.longitude }
    : { latitude: CURRENT_STOP.latitude, longitude: CURRENT_STOP.longitude };

  const userCoords = myLocation
    ? { latitude: myLocation.latitude, longitude: myLocation.longitude }
    : PEELAMEDU;

  const initialRegion = {
    latitude: truckCoords.latitude,
    longitude: truckCoords.longitude,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  const completedCount = STREET_STOPS.filter(s => s.status === 'completed').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, Shadows.md]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Street Collection Tracking</Text>
          <View style={styles.liveChip}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>GCT-001 LIVE</Text>
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
          <Text style={[styles.toggleBtnText, viewMode === 'street' && styles.toggleBtnTextActive]}>Street Route</Text>
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
            {/* ── Full remaining route polyline (faint background path) ── */}
            {fullRoutePath.length > 1 && (
              <Polyline
                coordinates={fullRoutePath}
                strokeColor="rgba(100, 160, 100, 0.35)"
                strokeWidth={5}
                lineDashPattern={[6, 4]}
              />
            )}

            {/* ── Truck → NEXT collection stop road arrow (bright, solid) ── */}
            {toNextStopPath.length > 1 && (
              <>
                {/* Glow halo */}
                <Polyline
                  coordinates={toNextStopPath}
                  strokeColor="rgba(255, 160, 0, 0.30)"
                  strokeWidth={9}
                />
                {/* Solid amber road path to next stop */}
                <Polyline
                  coordinates={toNextStopPath}
                  strokeColor="#FF8F00"
                  strokeWidth={5}
                />
              </>
            )}

            {/* ── Truck → citizen home road path (green) ── */}
            {toHomePath.length > 1 && (
              <>
                <Polyline
                  coordinates={toHomePath}
                  strokeColor="rgba(46, 125, 50, 0.25)"
                  strokeWidth={8}
                />
                <Polyline
                  coordinates={toHomePath}
                  strokeColor={Colors.primary}
                  strokeWidth={4}
                />
              </>
            )}

            {/* ── All street dustbin markers ── */}
            {STREET_STOPS.map((stop) => {
              const isDone = stop.status === 'completed';
              const isCurrent = stop.status === 'current';
              const isNext = stop.status === 'next';
              return (
                <Marker
                  key={stop.id}
                  coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                  title={`${stop.street} Dustbin`}
                  description={`${stop.binType} • ${stop.fillLevel}% full • ${stop.status.toUpperCase()}`}
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

            {/* ── Citizen home marker ── */}
            <Marker
              coordinate={userCoords}
              title="Your Location"
              description="Truck will arrive here for collection"
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={20}
              tracksViewChanges={false}
            >
              <View style={styles.homePin}>
                <MaterialCommunityIcons name="home" size={16} color="#fff" />
              </View>
            </Marker>

            {/* ── Live truck marker ── */}
            <Marker
              coordinate={truckCoords}
              title={`Truck GCT-001`}
              description={`Driver: ${truckData?.driverName || 'Murugan S'} • ${CURRENT_STOP.street}`}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={50}
              tracksViewChanges={false}
            >
              <View style={styles.truckPin}>
                <MaterialCommunityIcons name="truck-fast" size={18} color="#fff" />
              </View>
            </Marker>
          </MapView>

          {/* Locating overlay */}
          {isLocating && (
            <View style={styles.locatingPill}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.locatingText}>Finding your location...</Text>
            </View>
          )}

          {/* ── Bottom info panel ── */}
          <View style={styles.bottomPanel}>
            <View style={styles.panelHandle} />

            {/* ETA cards row */}
            <View style={styles.etaRow}>
              <View style={styles.etaCard}>
                <MaterialCommunityIcons name="timer-outline" size={20} color={Colors.primary} />
                <Text style={styles.etaValue}>{eta !== '—' ? eta : '—'}</Text>
                <Text style={styles.etaLabel}>ETA to You</Text>
              </View>
              <View style={styles.etaCard}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color={Colors.info} />
                <Text style={styles.etaValue}>{distanceKm != null ? `${distanceKm} km` : '—'}</Text>
                <Text style={styles.etaLabel}>Road Distance</Text>
              </View>
              <View style={styles.etaCard}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color={Colors.success} />
                <Text style={styles.etaValue}>{completedCount}/{STREET_STOPS.length}</Text>
                <Text style={styles.etaLabel}>Streets Done</Text>
              </View>
            </View>

            {/* Current + Next stop intimation */}
            <View style={styles.currentBanner}>
              <View style={[styles.bannerDot, { backgroundColor: '#FF8F00' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerLabel}>COLLECTING NOW</Text>
                <Text style={styles.bannerStreet}>{CURRENT_STOP.street}</Text>
                <Text style={styles.bannerAddress} numberOfLines={1}>{CURRENT_STOP.address}</Text>
              </View>
            </View>

            {/* Next stop road route card */}
            <View style={styles.nextStopCard}>
              <MaterialCommunityIcons name="navigation-variant" size={18} color="#FF8F00" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.nextStopLabel}>
                  NEXT STOP — {NEXT_STOP.street}
                </Text>
                <Text style={styles.nextStopAddress} numberOfLines={1}>{NEXT_STOP.address}</Text>
              </View>
              <View style={styles.nextStopEtaBadge}>
                <Text style={styles.nextStopEtaText}>
                  {nextStopEta !== '—' ? nextStopEta : '~5 min'}
                </Text>
              </View>
            </View>
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
            <Text style={styles.streetHeaderTitle}>Zone A — Sequential Street Run</Text>
            <Text style={styles.streetHeaderSub}>Truck GCT-001 traverses each street in order</Text>
            <View style={styles.streetProgressPill}>
              <Text style={styles.streetProgressText}>
                {completedCount} of {STREET_STOPS.length} streets cleared
              </Text>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Today's Street Collection Order</Text>

          {STREET_STOPS.map((stop, idx) => {
            const isDone = stop.status === 'completed';
            const isCurrent = stop.status === 'current';
            const isNext = stop.status === 'next';

            return (
              <View key={stop.id} style={[styles.streetCard, isCurrent && styles.streetCardActive, Shadows.sm]}>
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
                  {idx < STREET_STOPS.length - 1 && (
                    <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                  )}
                </View>

                {/* Content */}
                <View style={styles.streetContent}>
                  <View style={styles.streetTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.streetName}>{stop.street}</Text>
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
                        {isDone ? 'CLEANED' : isCurrent ? 'COLLECTING' : isNext ? 'NEXT' : 'AHEAD'}
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
                      <MaterialCommunityIcons
                        name="gauge"
                        size={11}
                        color={stop.fillLevel > 80 ? Colors.danger : Colors.warning}
                      />
                      <Text style={styles.metaText}>{stop.fillLevel}% full</Text>
                    </View>
                    <Text style={styles.timeText}>{stop.time}</Text>
                  </View>

                  {/* Next stop road route hint */}
                  {isNext && nextStopDist != null && (
                    <View style={styles.nextRouteHint}>
                      <MaterialCommunityIcons name="navigation-variant" size={12} color="#FF8F00" />
                      <Text style={styles.nextRouteHintText}>
                        Truck heading here via road — {nextStopDist} km, ETA {nextStopEta}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

// Subtle Google Maps style
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

  // Top bar
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

  // Toggle row
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

  // Markers
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

  // Locating pill
  locatingPill: {
    position: 'absolute', top: 80, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, elevation: 5,
  },
  locatingText: { ...textStyles.caption, color: Colors.primary },

  // Bottom info panel
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

  // Street list view
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
  timeText: { fontSize: 10, color: Colors.primary, fontFamily: 'Poppins_600SemiBold', marginLeft: 'auto' },

  nextRouteHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, backgroundColor: '#FFF3E0',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 4, borderWidth: 1, borderColor: '#FFE0B2',
  },
  nextRouteHintText: { fontSize: 10, color: '#FF8F00', fontFamily: 'Poppins_500Medium', flex: 1 },
});

export default LiveTracking;
