import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { getDriverRoutes, completeStop, startRoute, postDriverLocation } from '../../services/scheduleService';
import { broadcastDriverLocation } from '../../services/trackingService';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { getMultiStopRoadRoute, getRoadRoute } from '../../services/roadRoutingService';

const { width } = Dimensions.get('window');

// Default Coimbatore center
const COIMBATORE = { latitude: 11.0168, longitude: 76.9558 };

const LiveNavigation = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { user } = useAuth();
  const { location: myLocation, getCurrentLocation, startWatching } = useLocation();

  const [routeData, setRouteData] = useState(null);
  const [stops, setStops] = useState([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [roadPolyline, setRoadPolyline] = useState([]);
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [startingRoute, setStartingRoute] = useState(false);

  const loadRoutes = useCallback(async () => {
    try {
      const data = await getDriverRoutes();
      setRouteData(data);
      const stopList = data?.stops || [];
      setStops(stopList);
      setIsRouteActive(data?.status === 'active');

      const firstPending = stopList.findIndex(s => s.status !== 'completed');
      setCurrentStopIndex(firstPending >= 0 ? firstPending : 0);

      // Generate sequential road route in stop order (NOT TSP-reordered)
      const pendingStops = stopList.filter(s => s.latitude && s.longitude && s.status !== 'completed');
      if (pendingStops.length >= 2) {
        // Use the first pending stop as origin if no GPS yet, chain sequentially
        const origin = myLocation || pendingStops[0];
        const waypoints = myLocation ? pendingStops : pendingStops.slice(1);
        getMultiStopRoadRoute([origin, ...waypoints]).then(coords => {
          if (coords?.length > 0) setRoadPolyline(coords);
        }).catch(() => {});
      } else if (pendingStops.length === 1 && myLocation) {
        getRoadRoute(myLocation, pendingStops[0]).then(res => {
          if (res.coordinates?.length > 0) setRoadPolyline(res.coordinates);
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('LiveNavigation load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [myLocation]);

  useEffect(() => {
    loadRoutes();
    if (!myLocation) {
      getCurrentLocation().catch(() => {});
    }
  }, []);

  // Update sequential road polyline whenever current stop or location changes
  useEffect(() => {
    const pendingStops = stops.filter(s => s.status !== 'completed' && s.latitude && s.longitude);
    if (pendingStops.length >= 2) {
      const origin = myLocation || pendingStops[0];
      const waypoints = myLocation ? pendingStops : pendingStops.slice(1);
      getMultiStopRoadRoute([origin, ...waypoints]).then(coords => {
        if (coords?.length > 0) setRoadPolyline(coords);
      }).catch(() => {});
    } else if (pendingStops.length === 1 && myLocation) {
      getRoadRoute(myLocation, pendingStops[0]).then(res => {
        if (res.coordinates?.length > 0) setRoadPolyline(res.coordinates);
      }).catch(() => {});
    }
  }, [currentStopIndex, myLocation, stops]);

  const initialFitDoneRef = useRef(false);

  // Fit map ONCE on initial load to show all stops
  useEffect(() => {
    if (!mapRef.current || stops.length === 0 || initialFitDoneRef.current) return;
    const coords = stops
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ latitude: s.latitude, longitude: s.longitude }));

    if (coords.length > 0) {
      initialFitDoneRef.current = true;
      setTimeout(() => {
        try {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 90, right: 40, bottom: 320, left: 40 },
            animated: true,
          });
        } catch {}
      }, 500);
    }
  }, [stops]);

  const currentStop = stops[currentStopIndex] || null;
  const nextStop = stops[currentStopIndex + 1] || null;
  const completedCount = stops.filter(s => s.status === 'completed').length;

  const handleStartTrip = async () => {
    setStartingRoute(true);
    try {
      const updated = await startRoute(routeData?._id || 'today');
      setIsRouteActive(true);
      if (updated) setRouteData(updated);

      // Start watching location and broadcasting with the driver's own vehicleId
      const driverVehicleId = user?.vehicleId || routeData?.vehicleId || 'GCT-001';
      startWatching(async (loc) => {
        broadcastDriverLocation(driverVehicleId, {
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading || 0,
          speed: loc.speed || 0,
        });
        try {
          await postDriverLocation(loc.latitude, loc.longitude, driverVehicleId, loc.heading || 0, loc.speed || 0);
        } catch {}
      });

      Alert.alert('Route Active! 🚛', `Live GPS broadcasting on vehicle ${driverVehicleId}.`);
    } catch (e) {
      Alert.alert('Notice', e.message || 'Could not start trip.');
    } finally {
      setStartingRoute(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!routeData?._id || !currentStop?._id) {
      Alert.alert('No Route', 'No stop to complete.');
      return;
    }

    Alert.alert('Empty Dustbin?', `Confirm collection for "${currentStop.address}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm Emptied ✅',
        onPress: async () => {
          setCompleting(true);
          try {
            const updated = await completeStop(routeData._id, currentStop._id);
            const updatedStops = Array.isArray(updated?.stops) ? updated.stops : stops.map(s =>
              s._id === currentStop._id ? { ...s, status: 'completed', completedAt: new Date().toISOString() } : s
            );
            setStops(updatedStops);
            if (updated?.stops) setRouteData(updated);

            // Move to next stop
            const nextPending = updatedStops.findIndex(
              (s, i) => i > currentStopIndex && s.status !== 'completed'
            );
            if (nextPending >= 0) {
              setCurrentStopIndex(nextPending);
            } else {
              Alert.alert('Route Complete! 🎉', 'All street collection stops have been completed for today.', [
                { text: 'Back to Dashboard', onPress: () => navigation.goBack() }
              ]);
            }
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not complete stop.');
          } finally {
            setCompleting(false);
          }
        },
      }
    ]);
  };

  const handleSkipStop = () => {
    const nextPending = stops.findIndex(
      (s, i) => i > currentStopIndex && s.status !== 'completed'
    );
    if (nextPending >= 0) setCurrentStopIndex(nextPending);
    else Alert.alert('No more stops', 'There are no more pending stops.');
  };

  const myCoords = myLocation
    ? { latitude: myLocation.latitude, longitude: myLocation.longitude }
    : COIMBATORE;

  const initialRegion = {
    latitude: myCoords.latitude,
    longitude: myCoords.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Real Google Map ── */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={!!myLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          customMapStyle={mapStyle}
        >
          {/* ── Exact Road Polyline through all street stops ── */}
          {roadPolyline.length > 1 && (
            <>
              <Polyline
                coordinates={roadPolyline}
                strokeColor="rgba(21, 101, 192, 0.25)"
                strokeWidth={7}
              />
              <Polyline
                coordinates={roadPolyline}
                strokeColor="#1565C0"
                strokeWidth={4}
              />
            </>
          )}

          {/* ── Street Stop Markers ── */}
          {stops.map((stop, i) => {
            if (!stop.latitude || !stop.longitude) return null;
            const isCompleted = stop.status === 'completed';
            const isCurrent = i === currentStopIndex;
            const isNext = i === currentStopIndex + 1;
            return (
              <Marker
                key={stop._id || i}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                anchor={{ x: 0.5, y: 1 }}
                title={`Stop ${stop.stopNumber}: ${stop.address}`}
                description={`${stop.landmark} • ${stop.status.toUpperCase()}`}
                zIndex={isCurrent ? 25 : isNext ? 20 : 10}
                tracksViewChanges={false}
              >
                <View style={[
                  styles.stopMarker,
                  isCompleted && styles.stopMarkerDone,
                  isCurrent && styles.stopMarkerCurrent,
                  isNext && styles.stopMarkerNext,
                ]}>
                  {isCompleted ? (
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  ) : (
                    <Text style={styles.stopMarkerNum}>{stop.stopNumber}</Text>
                  )}
                </View>
              </Marker>
            );
          })}

          {/* ── Driver Current Truck Marker ── */}
          {myLocation && (
            <Marker
              coordinate={myCoords}
              anchor={{ x: 0.5, y: 0.5 }}
              title="Your Truck"
              zIndex={100}
              tracksViewChanges={false}
            >
              <View style={styles.driverMarker}>
                <MaterialCommunityIcons name="truck-fast" size={16} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* ── Top Bar ── */}
        <View style={[styles.navTopBar, Shadows.sm]}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.navTopInfo}>
            <Text style={styles.navETA}>
              {loading ? 'Loading route...' : currentStop
                ? `Street Stop ${currentStop.stopNumber} of ${stops.length}`
                : 'Route Completed'}
            </Text>
            <Text style={styles.navDist}>
              {completedCount} of {stops.length} street dustbins cleared
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navMapTypeBtn}
            onPress={() => {
              if (mapRef.current && currentStop) {
                mapRef.current.animateToRegion({
                  latitude: currentStop.latitude,
                  longitude: currentStop.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }
            }}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#1565C0" />
          </TouchableOpacity>
        </View>

        {/* Start Route Prompt Bar if Route is Pending */}
        {!isRouteActive && (
          <View style={[styles.startPromptBar, Shadows.md]}>
            <MaterialCommunityIcons name="information" size={18} color="#fff" />
            <Text style={styles.startPromptText}>Route is currently inactive</Text>
            <TouchableOpacity
              style={styles.startPromptBtn}
              onPress={handleStartTrip}
              disabled={startingRoute}
            >
              {startingRoute ? (
                <ActivityIndicator size="small" color="#1565C0" />
              ) : (
                <Text style={styles.startPromptBtnText}>Start Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Bottom Navigation Panel ── */}
      <View style={styles.navPanel}>
        {currentStop ? (
          <LinearGradient colors={['#0D47A1', '#1565C0']} style={styles.directionCard}>
            <View style={styles.directionIconBg}>
              <MaterialCommunityIcons name="trash-can" size={24} color="#1565C0" />
            </View>
            <View style={styles.directionInfo}>
              <Text style={styles.directionText} numberOfLines={1}>{currentStop.address}</Text>
              <Text style={styles.directionDist}>📍 {currentStop.landmark}</Text>
            </View>
            <View style={styles.stopNumBadge}>
              <Text style={styles.stopNumText}>#{currentStop.stopNumber}</Text>
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient colors={[Colors.success, Colors.primaryLight]} style={styles.directionCard}>
            <View style={styles.directionIconBg}>
              <MaterialCommunityIcons name="check-all" size={24} color={Colors.success} />
            </View>
            <View style={styles.directionInfo}>
              <Text style={styles.directionText}>All street dustbins collected!</Text>
              <Text style={styles.directionDist}>Zone A collection run finished 🎉</Text>
            </View>
          </LinearGradient>
        )}

        {/* Next Stop Info */}
        {currentStop && nextStop && (
          <View style={styles.nextStopRow}>
            <MaterialCommunityIcons name="map-marker-right" size={16} color={Colors.textTertiary} />
            <Text style={styles.nextStopLabel}>Next Street: </Text>
            <Text style={styles.nextStopAddress} numberOfLines={1}>{nextStop.address}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          {currentStop && (
            <TouchableOpacity
              style={[styles.arrivedBtn, Shadows.primary, completing && { opacity: 0.7 }]}
              onPress={handleMarkArrived}
              disabled={completing}
            >
              <LinearGradient colors={['#0D47A1', '#1565C0']} style={styles.arrivedBtnGradient}>
                {completing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                )}
                <Text style={styles.arrivedBtnText}>
                  {completing ? 'Updating...' : 'Mark Dustbin Emptied'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {currentStop && nextStop && (
            <TouchableOpacity style={[styles.skipBtn, Shadows.sm]} onPress={handleSkipStop}>
              <MaterialCommunityIcons name="skip-next-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          )}

          {!currentStop && (
            <TouchableOpacity
              style={[styles.arrivedBtn, Shadows.sm]}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient colors={Colors.gradientPrimary} style={styles.arrivedBtnGradient}>
                <MaterialCommunityIcons name="home" size={20} color="#fff" />
                <Text style={styles.arrivedBtnText}>Back to Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const mapStyle = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 15 }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f5' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapArea: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  stopMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.textTertiary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    elevation: 4,
  },
  stopMarkerDone: { backgroundColor: Colors.success },
  stopMarkerCurrent: { backgroundColor: '#1565C0', width: 34, height: 34, borderRadius: 17 },
  stopMarkerNext: { backgroundColor: Colors.warning },
  stopMarkerNum: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },

  driverMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    elevation: 6,
  },

  navTopBar: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: BorderRadius.lg, padding: Spacing.sm,
  },
  navBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm,
  },
  navTopInfo: { flex: 1 },
  navETA: { ...textStyles.h6, fontSize: 14, color: Colors.textPrimary },
  navDist: { ...textStyles.caption, color: Colors.textSecondary },
  navMapTypeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
  },

  startPromptBar: {
    position: 'absolute', top: 72, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#D32F2F', borderRadius: BorderRadius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  startPromptText: { ...textStyles.caption, color: '#fff', flex: 1, marginLeft: 6, fontFamily: 'Poppins_600SemiBold' },
  startPromptBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  startPromptBtnText: { ...textStyles.caption, color: '#1565C0', fontFamily: 'Poppins_700Bold' },

  navPanel: {
    backgroundColor: Colors.surface, padding: Spacing.base, paddingBottom: 24,
    borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'],
    ...Shadows.xl,
  },
  directionCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  directionIconBg: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  directionInfo: { flex: 1 },
  directionText: { ...textStyles.labelLarge, color: '#fff' },
  directionDist: { ...textStyles.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  stopNumBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  stopNumText: { ...textStyles.label, color: '#fff', fontFamily: 'Poppins_700Bold' },

  nextStopRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  nextStopLabel: { ...textStyles.caption, color: Colors.textTertiary },
  nextStopAddress: { ...textStyles.caption, color: Colors.textSecondary, flex: 1 },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  arrivedBtn: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  arrivedBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md,
  },
  arrivedBtnText: { ...textStyles.button, color: '#fff' },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  skipBtnText: { ...textStyles.label, color: Colors.textSecondary },
});

export default LiveNavigation;
