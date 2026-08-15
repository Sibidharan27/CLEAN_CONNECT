import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { getDriverRoutes, completeStop } from '../../services/scheduleService';
import { useLocation } from '../../context/LocationContext';

const { width, height } = Dimensions.get('window');

// Default Chennai center
const CHENNAI = { latitude: 13.0827, longitude: 80.2707 };

const LiveNavigation = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { location: myLocation } = useLocation();

  const [routeData, setRouteData] = useState(null);
  const [stops, setStops] = useState([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadRoutes = useCallback(async () => {
    try {
      const data = await getDriverRoutes();
      setRouteData(data);
      const stopList = data?.stops || [];
      setStops(stopList);

      // Find first non-completed stop
      const firstPending = stopList.findIndex(s => s.status !== 'completed');
      setCurrentStopIndex(firstPending >= 0 ? firstPending : 0);
    } catch (e) {
      console.warn('LiveNavigation error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoutes(); }, []);

  // Fit map to show all pending stops + current location
  useEffect(() => {
    if (!mapRef.current || stops.length === 0) return;
    const coords = stops
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ latitude: s.latitude, longitude: s.longitude }));
    if (myLocation) coords.push({ latitude: myLocation.latitude, longitude: myLocation.longitude });
    if (coords.length > 0) {
      try {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 40, bottom: 300, left: 40 },
          animated: true,
        });
      } catch {}
    }
  }, [stops, myLocation]);

  const currentStop = stops[currentStopIndex] || null;
  const nextStop = stops[currentStopIndex + 1] || null;
  const completedCount = stops.filter(s => s.status === 'completed').length;

  const handleMarkArrived = async () => {
    if (!routeData?._id || !currentStop?._id) {
      Alert.alert('No route', 'No stop to complete.');
      return;
    }
    Alert.alert('Arrived?', `Mark "${currentStop.address}" as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Done ✅',
        onPress: async () => {
          setCompleting(true);
          try {
            const updated = await completeStop(routeData._id, currentStop._id);
            const updatedStops = updated.stops || [];
            setStops(updatedStops);
            setRouteData(updated);
            // Move to next pending stop
            const nextPending = updatedStops.findIndex(
              (s, i) => i > currentStopIndex && s.status !== 'completed'
            );
            if (nextPending >= 0) setCurrentStopIndex(nextPending);
            else {
              Alert.alert('Route Complete! 🎉', 'All stops for today have been completed.', [
                { text: 'Go Back', onPress: () => navigation.goBack() }
              ]);
            }
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not complete stop');
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
    : CHENNAI;

  const initialRegion = {
    latitude: myCoords.latitude,
    longitude: myCoords.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  const routeCoords = stops
    .filter(s => s.latitude && s.longitude)
    .map(s => ({ latitude: s.latitude, longitude: s.longitude }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Real Google Map ── */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          customMapStyle={mapStyle}
        >
          {/* ── Route polyline through all stops ── */}
          {myLocation && routeCoords.length > 0 && (
            <Polyline
              coordinates={[myCoords, ...routeCoords]}
              strokeColor={Colors.primary}
              strokeWidth={3}
              lineDashPattern={[10, 4]}
            />
          )}

          {/* ── All stop markers ── */}
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
                title={`Stop ${stop.stopNumber}`}
                description={stop.address}
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

          {/* ── Driver current location marker ── */}
          {myLocation && (
            <Marker
              coordinate={myCoords}
              anchor={{ x: 0.5, y: 0.5 }}
              title="You"
            >
              <View style={styles.driverMarker}>
                <MaterialCommunityIcons name="truck-fast" size={16} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* ── Top navigation bar ── */}
        <View style={[styles.navTopBar, Shadows.sm]}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.navTopInfo}>
            <Text style={styles.navETA}>
              {loading ? 'Loading route...' : currentStop
                ? `Stop ${currentStop.stopNumber} of ${stops.length}`
                : 'Route complete'}
            </Text>
            <Text style={styles.navDist}>
              {completedCount} of {stops.length} completed
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navMapTypeBtn}
            onPress={() => {
              if (mapRef.current && stops[currentStopIndex]) {
                mapRef.current.animateToRegion({
                  latitude: stops[currentStopIndex].latitude,
                  longitude: stops[currentStopIndex].longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }
            }}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Navigation Panel ── */}
      <View style={styles.navPanel}>
        {/* Current stop direction card */}
        {currentStop ? (
          <LinearGradient colors={['#0D47A1', '#1565C0']} style={styles.directionCard}>
            <View style={styles.directionIconBg}>
              <MaterialCommunityIcons name="navigation-variant" size={26} color="#1565C0" />
            </View>
            <View style={styles.directionInfo}>
              <Text style={styles.directionText} numberOfLines={1}>{currentStop.address}</Text>
              <Text style={styles.directionDist}>{currentStop.landmark}</Text>
            </View>
            <View style={styles.stopNumBadge}>
              <Text style={styles.stopNumText}>#{currentStop.stopNumber}</Text>
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient colors={[Colors.success, Colors.primaryLight]} style={styles.directionCard}>
            <View style={styles.directionIconBg}>
              <MaterialCommunityIcons name="check-all" size={26} color={Colors.success} />
            </View>
            <View style={styles.directionInfo}>
              <Text style={styles.directionText}>All stops completed!</Text>
              <Text style={styles.directionDist}>Great job today 🎉</Text>
            </View>
          </LinearGradient>
        )}

        {/* Stop Info */}
        {currentStop && (
          <View style={styles.stopInfo}>
            <View style={styles.stopInfoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopLabel}>CURRENT DESTINATION</Text>
                <Text style={styles.stopAddress} numberOfLines={1}>{currentStop.address}</Text>
                <Text style={styles.stopLandmark}>{currentStop.landmark}</Text>
              </View>
              {currentStop.complaintsCount > 0 && (
                <View style={styles.complaintBadge}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.danger} />
                  <Text style={styles.complaintText}>{currentStop.complaintsCount}</Text>
                </View>
              )}
            </View>

            {nextStop && (
              <View style={styles.nextStopRow}>
                <MaterialCommunityIcons name="map-marker-right" size={16} color={Colors.textTertiary} />
                <Text style={styles.nextStopLabel}>Next: </Text>
                <Text style={styles.nextStopAddress} numberOfLines={1}>{nextStop.address}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {currentStop && (
            <TouchableOpacity
              style={[styles.arrivedBtn, Shadows.primary, completing && { opacity: 0.7 }]}
              onPress={handleMarkArrived}
              disabled={completing}
            >
              <LinearGradient colors={['#0D47A1', '#1565C0']} style={styles.arrivedBtnGradient}>
                <MaterialCommunityIcons
                  name={completing ? 'loading' : 'check-circle-outline'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.arrivedBtnText}>
                  {completing ? 'Saving...' : 'Mark Arrived'}
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
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f2f2f2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e4f5' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapArea: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  // Markers
  stopMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.textTertiary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    elevation: 4,
  },
  stopMarkerDone: { backgroundColor: Colors.success },
  stopMarkerCurrent: { backgroundColor: '#1565C0', width: 34, height: 34, borderRadius: 17 },
  stopMarkerNext: { backgroundColor: Colors.warning },
  stopMarkerNum: { ...textStyles.caption, color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 10 },

  driverMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
    elevation: 6,
  },

  // Top bar
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
  navETA: { ...textStyles.h6, color: Colors.textPrimary },
  navDist: { ...textStyles.caption, color: Colors.textSecondary },
  navMapTypeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySurface, justifyContent: 'center', alignItems: 'center',
  },

  // Bottom panel
  navPanel: {
    backgroundColor: Colors.surface, padding: Spacing.base,
    borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'],
    ...Shadows.xl,
  },
  directionCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  directionIconBg: {
    width: 46, height: 46, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  directionInfo: { flex: 1 },
  directionText: { ...textStyles.h6, color: '#fff' },
  directionDist: { ...textStyles.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  stopNumBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.sm,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  stopNumText: { ...textStyles.label, color: '#fff', fontFamily: 'Poppins_700Bold' },

  stopInfo: {
    backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  stopInfoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.sm },
  stopLabel: { ...textStyles.overline, color: Colors.textTertiary, marginBottom: 4 },
  stopAddress: { ...textStyles.h6, color: Colors.textPrimary },
  stopLandmark: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  complaintBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  complaintText: { ...textStyles.caption, color: Colors.danger, fontFamily: 'Poppins_700Bold' },
  nextStopRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
