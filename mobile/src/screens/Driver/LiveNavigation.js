import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { getDriverRoutes, completeStop, startRoute, stopRoute, postDriverLocation } from '../../services/scheduleService';
import { broadcastDriverLocation } from '../../services/trackingService';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { getMultiStopRoadRoute, getRoadRoute } from '../../services/roadRoutingService';

const { width } = Dimensions.get('window');

// Default Peelamedu center
const PEELAMEDU = { latitude: 11.0244, longitude: 77.0028 };

// Proximity threshold for street completion (50 metres)
const PROXIMITY_RADIUS_METERS = 50;

// Haversine distance helper in metres
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const LiveNavigation = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { user } = useAuth();
  const { location: myLocation, getCurrentLocation, startWatching, stopWatching } = useLocation();

  const [routeData, setRouteData] = useState(null);
  const [stops, setStops] = useState([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [roadPolyline, setRoadPolyline] = useState([]);
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [startingRoute, setStartingRoute] = useState(false);
  const [markerTracksViews, setMarkerTracksViews] = useState(true);
  const markerTrackTimer = useRef(null);

  const loadRoutes = useCallback(async () => {
    try {
      const data = await getDriverRoutes();
      setRouteData(data);
      const stopList = data?.stops || [];
      setStops(stopList);
      setIsRouteActive(data?.status === 'active');

      const firstPending = stopList.findIndex(s => s.status !== 'completed');
      setCurrentStopIndex(firstPending >= 0 ? firstPending : 0);

      // Generate sequential road route in stop order
      const pendingStops = stopList.filter(s => s.latitude && s.longitude && s.status !== 'completed');
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

  useEffect(() => {
    if (stops.length === 0) return;
    if (markerTrackTimer.current) clearTimeout(markerTrackTimer.current);
    setMarkerTracksViews(true);
    markerTrackTimer.current = setTimeout(() => setMarkerTracksViews(false), 1200);
    return () => {
      if (markerTrackTimer.current) clearTimeout(markerTrackTimer.current);
    };
  }, [stops, currentStopIndex]);

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
  const nextStopIndex = stops.findIndex((s, i) => i > currentStopIndex && s.status !== 'completed');
  const nextStop = nextStopIndex >= 0 ? stops[nextStopIndex] : null;
  const completedCount = stops.filter(s => s.status === 'completed').length;
  const zoneName = routeData?.zoneName || user?.zone || 'Peelamedu – PSG Zone';
  const vehicleId = user?.vehicleId || routeData?.vehicleId || 'GCT-001';

  // Real-time distance and proximity calculation
  const currentDistanceMeters = (myLocation?.latitude && currentStop?.latitude && currentStop?.longitude)
    ? getDistanceMeters(myLocation.latitude, myLocation.longitude, currentStop.latitude, currentStop.longitude)
    : null;

  // Account for GPS accuracy tolerance (e.g. 50m + up to 20m accuracy margin)
  const isWithinProximity = currentDistanceMeters !== null
    ? currentDistanceMeters <= (PROXIMITY_RADIUS_METERS + Math.min(myLocation?.accuracy || 0, 20))
    : false;

  const handleStartTrip = async () => {
    setStartingRoute(true);
    try {
      const updated = await startRoute(routeData?._id || 'today');
      setIsRouteActive(true);
      if (updated) {
        setRouteData(updated);
        if (updated.stops) {
          setStops(updated.stops);
          const firstPending = updated.stops.findIndex(s => s.status !== 'completed');
          setCurrentStopIndex(firstPending >= 0 ? firstPending : 0);
        }
      }

      // Start watching location and broadcasting with driver's vehicleId
      startWatching(async (loc) => {
        broadcastDriverLocation(vehicleId, {
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading || 0,
          speed: loc.speed || 0,
        });
        try {
          await postDriverLocation(loc.latitude, loc.longitude, vehicleId, loc.heading || 0, loc.speed || 0);
        } catch {}
      });

      Alert.alert('Route Active! 🚛', `Live street collection started for ${zoneName} on vehicle ${vehicleId}.`);
    } catch (e) {
      Alert.alert('Notice', e.message || 'Could not start trip.');
    } finally {
      setStartingRoute(false);
    }
  };

  const handlePauseTrip = () => {
    Alert.alert('Pause Route?', 'Do you want to pause live GPS broadcasting? You can resume anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pause',
        onPress: async () => {
          stopWatching();
          setIsRouteActive(false);
          try {
            if (routeData?._id) {
              const updated = await stopRoute(routeData._id);
              if (updated) setRouteData(updated);
            }
          } catch (e) {
            console.warn(e);
          }
        }
      }
    ]);
  };

  const handleMarkArrived = async () => {
    if (!routeData?._id || !currentStop?._id) {
      Alert.alert('No Route', 'No stop to complete.');
      return;
    }

    // Strict proximity enforcement: driver must be within allowed geofence (50m)
    if (!isWithinProximity && currentStop.latitude && currentStop.longitude) {
      const distText = currentDistanceMeters !== null ? `${currentDistanceMeters}m` : 'too far';
      Alert.alert(
        '📍 Move Closer to Collection Area',
        `You are currently ${distText} away from "${currentStop.street || currentStop.address}".\n\nMove closer to the collection area (within ${PROXIMITY_RADIUS_METERS}m) to mark this street complete.`,
        [{ text: 'Understood', style: 'default' }]
      );
      return;
    }

    Alert.alert('Complete Street Collection?', `Mark "${currentStop.street || currentStop.address}" as finished?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm Done ✅',
        onPress: async () => {
          setCompleting(true);
          const stopIdToComplete = currentStop._id;
          const now = new Date().toISOString();

          // 1. Instant optimistic state update for iPhone & Android
          // Current stop immediately becomes COMPLETED; next pending stop immediately becomes IN_PROGRESS / CURRENT
          const optimisticStops = stops.map(s => {
            if (s._id === stopIdToComplete) {
              return { ...s, status: 'completed', completedAt: now };
            }
            return s;
          });

          const nextPendingIdx = optimisticStops.findIndex(s => s.status !== 'completed');
          if (nextPendingIdx >= 0) {
            optimisticStops[nextPendingIdx] = { ...optimisticStops[nextPendingIdx], status: 'in_progress' };
            setCurrentStopIndex(nextPendingIdx);
          }
          setStops(optimisticStops);

          // Force iOS marker refresh
          setMarkerTracksViews(true);
          setTimeout(() => setMarkerTracksViews(false), 800);

          try {
            const bodyCoords = myLocation ? { latitude: myLocation.latitude, longitude: myLocation.longitude } : {};
            const updated = await completeStop(routeData._id, stopIdToComplete, bodyCoords);

            if (updated?.stops && Array.isArray(updated.stops) && updated.stops.length > 0) {
              setStops(updated.stops);
              setRouteData(updated);
              const serverNextIdx = updated.stops.findIndex(s => s.status !== 'completed');
              if (serverNextIdx >= 0) {
                setCurrentStopIndex(serverNextIdx);
              } else {
                Alert.alert('Zone Collection Complete! 🎉', `All ${updated.stops.length} streets in ${zoneName} have been completed.`, [
                  { text: 'Back to Dashboard', onPress: () => navigation.goBack() }
                ]);
              }
            } else if (nextPendingIdx < 0) {
              Alert.alert('Zone Collection Complete! 🎉', `All ${stops.length} streets in ${zoneName} have been completed.`, [
                { text: 'Back to Dashboard', onPress: () => navigation.goBack() }
              ]);
            }
          } catch (e) {
            Alert.alert('Notice', e.message || 'Could not complete stop.');
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
    : (currentStop ? { latitude: currentStop.latitude, longitude: currentStop.longitude } : PEELAMEDU);

  const initialRegion = {
    latitude: myCoords.latitude,
    longitude: myCoords.longitude,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
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
          {/* Exact Road Polyline through all street stops */}
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

          {/* Street Stop Markers with iPhone instant synchronization */}
          {stops.map((stop, i) => {
            if (!stop.latitude || !stop.longitude) return null;
            const isCompleted = stop.status === 'completed';
            const isCurrent = i === currentStopIndex && !isCompleted;
            const isNext = i === nextStopIndex && !isCompleted;
            const roleTag = isCompleted ? 'done' : isCurrent ? 'curr' : isNext ? 'next' : 'pend';
            return (
              <Marker
                key={`marker-${stop._id || i}-${stop.status}-${roleTag}`}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                anchor={{ x: 0.5, y: 1 }}
                title={`Street ${stop.stopNumber}: ${stop.street || stop.address}`}
                description={`${stop.landmark} • ${isCompleted ? 'COMPLETED' : isCurrent ? 'CURRENT COLLECTION' : isNext ? 'NEXT STOP' : 'PENDING'}`}
                zIndex={isCurrent ? 30 : isNext ? 20 : isCompleted ? 5 : 10}
                tracksViewChanges={markerTracksViews}
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

          {/* Driver Current Truck Marker */}
          {myLocation && (
            <Marker
              coordinate={myCoords}
              anchor={{ x: 0.5, y: 0.5 }}
              title="Your Truck"
              zIndex={100}
              tracksViewChanges={true}
            >
              <View style={styles.driverMarker}>
                <MaterialCommunityIcons name="truck-fast" size={16} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* ── Top Bar with Zone & Route Details ── */}
        <View style={[styles.navTopBar, Shadows.md]}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.navTopInfo}>
            <View style={styles.zoneTagRow}>
              <Text style={styles.zoneNameText} numberOfLines={1}>{zoneName}</Text>
              <View style={[styles.statusBadge, isRouteActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                <Text style={[styles.statusBadgeText, isRouteActive ? { color: Colors.success } : { color: Colors.warning }]}>
                  {isRouteActive ? 'LIVE ROUTE' : 'READY'}
                </Text>
              </View>
            </View>
            <Text style={styles.navDist}>
              Vehicle: {vehicleId} • {completedCount}/{stops.length} Streets Cleared
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
      </View>

      {/* ── Bottom Navigation & Action Panel ── */}
      <View style={styles.navPanel}>
        {/* Prominent Start/Pause Control Button */}
        {!isRouteActive ? (
          <View style={styles.startRouteCard}>
            <View style={styles.startRouteHeader}>
              <MaterialCommunityIcons name="map-marker-path" size={22} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.startRouteTitle}>Ready for Collection Run</Text>
                <Text style={styles.startRouteSubtitle}>{zoneName} ({stops.length} nearby streets)</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryStartBtn, Shadows.primary, startingRoute && { opacity: 0.7 }]}
              onPress={handleStartTrip}
              disabled={startingRoute}
              activeOpacity={0.88}
            >
              <LinearGradient colors={Colors.gradientPrimary} style={styles.primaryStartGradient}>
                {startingRoute ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
                    <Text style={styles.primaryStartBtnText}>Start Today&apos;s Route</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Current Street Card */}
        {currentStop ? (
          <LinearGradient colors={['#0D47A1', '#1565C0']} style={styles.directionCard}>
            <View style={styles.directionIconBg}>
              <MaterialCommunityIcons name="trash-can" size={24} color="#1565C0" />
            </View>
            <View style={styles.directionInfo}>
              <Text style={styles.directionPre}>CURRENT COLLECTION STREET</Text>
              <Text style={styles.directionText} numberOfLines={1}>{currentStop.street || currentStop.address}</Text>
              <Text style={styles.directionDist} numberOfLines={1}>📍 {currentStop.landmark}</Text>
              
              {/* Proximity range indicator pill */}
              <View style={[styles.proximityPill, isWithinProximity ? styles.proximityPillIn : styles.proximityPillOut]}>
                <MaterialCommunityIcons
                  name={isWithinProximity ? 'check-circle' : 'map-marker-distance'}
                  size={12}
                  color={isWithinProximity ? '#A7F3D0' : '#FDE68A'}
                />
                <Text style={[styles.proximityPillText, { color: isWithinProximity ? '#A7F3D0' : '#FDE68A' }]}>
                  {currentDistanceMeters !== null ? `${currentDistanceMeters}m away` : 'Locating GPS...'} • {isWithinProximity ? 'Within 50m range (Allowed)' : 'Move closer (<50m)'}
                </Text>
              </View>
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
              <Text style={styles.directionText}>All Zone Streets Collected!</Text>
              <Text style={styles.directionDist}>{zoneName} run completed 🎉</Text>
            </View>
          </LinearGradient>
        )}

        {/* Next Street Info */}
        {currentStop && nextStop && (
          <View style={styles.nextStopRow}>
            <MaterialCommunityIcons name="map-marker-right" size={16} color="#FF8F00" />
            <Text style={styles.nextStopLabel}>Next Street: </Text>
            <Text style={styles.nextStopAddress} numberOfLines={1}>{nextStop.street || nextStop.address}</Text>
          </View>
        )}

        {/* Actions Row */}
        {isRouteActive && (
          <View style={styles.actionRow}>
            {currentStop && (
              <TouchableOpacity
                style={[
                  styles.arrivedBtn,
                  Shadows.primary,
                  completing && { opacity: 0.7 },
                  !isWithinProximity && styles.arrivedBtnDisabled,
                ]}
                onPress={handleMarkArrived}
                disabled={completing}
              >
                <LinearGradient
                  colors={isWithinProximity ? ['#2E7D32', '#388E3C'] : ['#546E7A', '#37474F']}
                  style={styles.arrivedBtnGradient}
                >
                  {completing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons
                      name={isWithinProximity ? 'check-circle' : 'map-marker-radius'}
                      size={20}
                      color="#fff"
                    />
                  )}
                  <Text style={styles.arrivedBtnText}>
                    {completing
                      ? 'Updating...'
                      : isWithinProximity
                      ? 'Street Completed ✓'
                      : `Too Far (${currentDistanceMeters != null ? `${currentDistanceMeters}m` : '>50m'})`}
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

            <TouchableOpacity style={[styles.pauseBtn, Shadows.sm]} onPress={handlePauseTrip}>
              <MaterialCommunityIcons name="pause" size={18} color={Colors.danger} />
              <Text style={styles.pauseBtnText}>Pause</Text>
            </TouchableOpacity>
          </View>
        )}

        {!currentStop && (
          <TouchableOpacity
            style={[styles.arrivedBtn, Shadows.sm, { marginTop: 8 }]}
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
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: BorderRadius.lg, padding: Spacing.sm,
  },
  navBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm,
  },
  navTopInfo: { flex: 1 },
  zoneTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zoneNameText: { ...textStyles.labelLarge, fontSize: 13, color: Colors.textPrimary, flexShrink: 1 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeActive: { backgroundColor: Colors.successSurface },
  statusBadgeInactive: { backgroundColor: Colors.warningSurface },
  statusBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold' },
  navDist: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 1 },
  navMapTypeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
  },

  navPanel: {
    backgroundColor: Colors.surface, padding: Spacing.base, paddingBottom: 24,
    borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'],
    ...Shadows.xl,
  },
  startRouteCard: {
    backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
  },
  startRouteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  startRouteTitle: { ...textStyles.labelLarge, color: Colors.primary },
  startRouteSubtitle: { ...textStyles.caption, color: Colors.textSecondary },
  primaryStartBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  primaryStartGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: Spacing.md,
  },
  primaryStartBtnText: { ...textStyles.button, color: '#fff', fontSize: 15 },

  directionCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  directionIconBg: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  directionInfo: { flex: 1 },
  directionPre: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  directionText: { ...textStyles.labelLarge, color: '#fff', fontSize: 14 },
  directionDist: { ...textStyles.caption, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  proximityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
    marginTop: 4, alignSelf: 'flex-start',
  },
  proximityPillIn: { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderWidth: 1, borderColor: '#10B981' },
  proximityPillOut: { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderWidth: 1, borderColor: '#F59E0B' },
  proximityPillText: { fontSize: 10.5, fontFamily: 'Poppins_600SemiBold' },
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
  arrivedBtnDisabled: { opacity: 0.88 },
  arrivedBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md,
  },
  arrivedBtnText: { ...textStyles.button, color: '#fff' },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  skipBtnText: { ...textStyles.label, color: Colors.textSecondary },
  pauseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  pauseBtnText: { ...textStyles.label, color: Colors.danger },
});

export default LiveNavigation;
