import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { getDriverStats, getDriverRoutes, startRoute, postDriverLocation } from '../../services/scheduleService';
import { broadcastDriverLocation, joinDriverRoom } from '../../services/trackingService';

const StatCard = ({ icon, value, label, color, bg }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, delay: 100, tension: 60, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, Shadows.sm, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.statIconBg, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

const DriverDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { startWatching, stopWatching, getCurrentLocation } = useLocation();

  const [routeData, setRouteData] = useState(null);
  const [stats, setStats] = useState({ completed: 0, remaining: 0, totalStops: 0, routeStatus: 'pending' });
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [statsData, routeRes] = await Promise.allSettled([getDriverStats(), getDriverRoutes()]);
      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value);
        setIsRouteActive(statsData.value.routeStatus === 'active');
      }
      if (routeRes.status === 'fulfilled' && routeRes.value) {
        setRouteData(routeRes.value);
        if (routeRes.value.status === 'active') {
          setIsRouteActive(true);
        }
      }
    } catch (e) {
      console.warn('Driver Dashboard load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (user?._id || user?.id) joinDriverRoom(user._id || user.id);
  }, [user]);

  useEffect(() => {
    const progress = stats.totalStops > 0 ? stats.completed / stats.totalStops : 0;
    Animated.timing(progressAnim, { toValue: progress, duration: 1000, useNativeDriver: false }).start();
  }, [stats]);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const progress = stats.totalStops > 0 ? stats.completed / stats.totalStops : 0;

  const handleStartRoute = async () => {
    setStarting(true);
    try {
      let rId = routeData?._id;
      if (!rId) {
        const fetched = await getDriverRoutes();
        if (fetched?._id) {
          rId = fetched._id;
          setRouteData(fetched);
        }
      }

      await startRoute(rId || 'today');
      setIsRouteActive(true);
      setStats(prev => ({ ...prev, routeStatus: 'active' }));

      // Broadcast first location immediately
      const driverVehicleId = user?.vehicleId || routeData?.vehicleId || 'GCT-001';
      getCurrentLocation().then(async (loc) => {
        if (loc) {
          broadcastDriverLocation(driverVehicleId, {
            latitude: loc.latitude,
            longitude: loc.longitude,
            heading: loc.heading || 0,
            speed: loc.speed || 0,
          });
          try {
            await postDriverLocation(loc.latitude, loc.longitude, driverVehicleId, loc.heading || 0, loc.speed || 0);
          } catch {}
        }
      }).catch(() => {});

      // Begin continuous watch
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

      Alert.alert(
        'Route Started! 🚛',
        'Your vehicle GPS is now broadcasting to citizens in real-time.',
        [
          { text: 'Stay Here', style: 'cancel' },
          {
            text: 'Open Navigation 🚀',
            onPress: () => navigation.navigate('LiveNavigation'),
          },
        ]
      );
    } catch (e) {
      Alert.alert('Notice', e.message || 'Could not start route. Please check your connection and try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleStopRoute = () => {
    Alert.alert('Stop Route?', 'Are you sure you want to pause today\'s collection run?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pause Route',
        style: 'destructive',
        onPress: () => {
          setIsRouteActive(false);
          stopWatching();
          setStats(prev => ({ ...prev, routeStatus: 'pending' }));
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Header */}
        <LinearGradient colors={['#0D47A1', '#1565C0', '#1976D2']} style={styles.header}>
          <View style={styles.headerCircle} />
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                {new Date().getHours() < 12 ? 'Good Morning 🌤️' : 'Good Afternoon ☀️'}
              </Text>
              <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
              <View style={styles.empIdChip}>
                <MaterialCommunityIcons name="badge-account-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.empIdText}>{user?.employeeId || user?.email?.split('@')[0] || 'Driver'}</Text>
              </View>
            </View>
            {/* Header action buttons */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate('DriverProfile')}
              >
                <MaterialCommunityIcons name="account-circle-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIconBtn, { marginLeft: 8 }]}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons name="logout" size={20} color="rgba(255,80,80,0.9)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Card */}
          <View style={[styles.statusCard, Shadows.md]}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <MaterialCommunityIcons
                  name={isRouteActive ? 'truck-fast' : 'truck-outline'}
                  size={24}
                  color={isRouteActive ? Colors.primary : Colors.textTertiary}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.statusTitle}>
                    {isRouteActive ? 'Route In Progress' : 'Ready to Start'}
                  </Text>
                  <Text style={styles.statusSubtitle}>Vehicle: {routeData?.vehicleId || 'GCT-001'}</Text>
                </View>
              </View>
              <View style={[styles.statusDot, isRouteActive && styles.statusDotActive]} />
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Today's Progress</Text>
                <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressSubtitle}>
                {loading ? 'Loading...' : `${stats.completed} of ${stats.totalStops || (routeData?.stops?.length || 0)} stops completed`}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard icon="map-marker-check" value={stats.completed} label="Done" color={Colors.success} bg={Colors.successSurface} />
            <StatCard icon="map-marker-outline" value={stats.remaining} label="Remaining" color={Colors.info} bg={Colors.infoSurface} />
            <StatCard icon="road-variant" value={stats.totalStops || (routeData?.stops?.length || 0)} label="Total Stops" color={Colors.warning} bg={Colors.warningSurface} />
          </View>

          {/* GPS Status indicator */}
          {isRouteActive && (
            <View style={[styles.gpsBroadcastCard, Shadows.sm]}>
              <View style={styles.gpsLiveDot} />
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={Colors.success} />
              <Text style={styles.gpsBroadcastText}>GPS Live • Broadcasting street location to citizens</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {isRouteActive ? (
              <TouchableOpacity style={[styles.stopBtn, Shadows.md]} onPress={handleStopRoute}>
                <MaterialCommunityIcons name="pause-circle-outline" size={22} color={Colors.danger} />
                <Text style={styles.stopBtnText}>Pause Route</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.startBtn, Shadows.primary]}
                onPress={handleStartRoute}
                disabled={starting}
              >
                <LinearGradient colors={Colors.gradientPrimary} style={styles.startBtnGradient}>
                  {starting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="play-circle-outline" size={22} color="#fff" />
                      <Text style={styles.startBtnText}>Start Today's Route</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.routeBtn, Shadows.sm]} onPress={() => navigation.navigate('AssignedRoutes')}>
              <MaterialCommunityIcons name="map-outline" size={22} color={Colors.info} />
              <Text style={styles.routeBtnText}>View Route</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Nav Cards */}
          <View style={styles.quickNavRow}>
            <TouchableOpacity
              style={[styles.quickNavCard, Shadows.sm]}
              onPress={() => navigation.navigate('LiveNavigation')}
            >
              <View style={[styles.quickNavIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="navigation-variant" size={22} color="#1565C0" />
              </View>
              <Text style={styles.quickNavTitle}>Live Navigation</Text>
              <Text style={styles.quickNavSub}>Street GPS & Stops</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickNavCard, Shadows.sm]}
              onPress={() => navigation.navigate('CompletedCollections')}
            >
              <View style={[styles.quickNavIcon, { backgroundColor: Colors.successSurface }]}>
                <MaterialCommunityIcons name="clipboard-check-multiple-outline" size={22} color={Colors.success} />
              </View>
              <Text style={styles.quickNavTitle}>Completed</Text>
              <Text style={styles.quickNavSub}>View history</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickNavCard, Shadows.sm]}
              onPress={() => navigation.navigate('DriverProfile')}
            >
              <View style={[styles.quickNavIcon, { backgroundColor: Colors.warningSurface }]}>
                <MaterialCommunityIcons name="account-outline" size={22} color={Colors.warning} />
              </View>
              <Text style={styles.quickNavTitle}>My Profile</Text>
              <Text style={styles.quickNavSub}>View info</Text>
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={[styles.workSummary, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            {[
              { label: 'Route Status', value: isRouteActive ? 'In Progress (Active)' : stats.routeStatus === 'completed' ? 'Completed' : 'Ready to Start', icon: 'truck', color: isRouteActive ? Colors.success : Colors.info },
              { label: 'Completed Stops', value: `${stats.completed}/${stats.totalStops || (routeData?.stops?.length || 0)}`, icon: 'map-marker-multiple-outline', color: Colors.primary },
              { label: 'GPS Broadcast', value: isRouteActive ? 'Active (Live)' : 'Off', icon: 'crosshairs-gps', color: isRouteActive ? Colors.success : Colors.textTertiary },
            ].map(s => (
              <View key={s.label} style={styles.summaryRow}>
                <View style={[styles.summaryIconBg, { backgroundColor: s.color + '15' }]}>
                  <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={styles.summaryLabel}>{s.label}</Text>
                <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingBottom: 32, overflow: 'hidden' },
  headerCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  greeting: { ...textStyles.body, color: 'rgba(255,255,255,0.8)' },
  driverName: { ...textStyles.h4, color: '#fff', marginVertical: 2 },
  empIdChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  empIdText: { ...textStyles.caption, color: 'rgba(255,255,255,0.9)' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  statusCard: { backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: Spacing.base },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusTitle: { ...textStyles.labelLarge, color: Colors.textPrimary },
  statusSubtitle: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.textTertiary },
  statusDotActive: { backgroundColor: Colors.success },
  progressSection: {},
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { ...textStyles.label, color: Colors.textSecondary },
  progressPercent: { ...textStyles.label, color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  progressBarBg: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressSubtitle: { ...textStyles.caption, color: Colors.textTertiary },
  content: { padding: Spacing.base },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: -20, marginBottom: Spacing.base },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  statIconBg: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { ...textStyles.h6, fontSize: 15 },
  statLabel: { ...textStyles.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: 1 },
  gpsBroadcastCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.successSurface, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.success + '40' },
  gpsLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  gpsBroadcastText: { ...textStyles.label, color: Colors.success, flex: 1 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  startBtn: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden', minHeight: 48 },
  startBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md },
  startBtnText: { ...textStyles.button, color: '#fff' },
  stopBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.danger + '40', minHeight: 48 },
  stopBtnText: { ...textStyles.button, color: Colors.danger },
  routeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.infoSurface, borderRadius: BorderRadius.lg, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderWidth: 1.5, borderColor: Colors.info + '30', minHeight: 48 },
  routeBtnText: { ...textStyles.label, color: Colors.info },
  quickNavRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  quickNavCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  quickNavIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickNavTitle: { ...textStyles.labelSmall, color: Colors.textPrimary, textAlign: 'center', fontFamily: 'Poppins_600SemiBold' },
  quickNavSub: { ...textStyles.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: 2 },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.md },
  workSummary: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.sm },
  summaryIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  summaryLabel: { ...textStyles.body, color: Colors.textSecondary, flex: 1 },
  summaryValue: { ...textStyles.labelLarge },
});

export default DriverDashboard;
