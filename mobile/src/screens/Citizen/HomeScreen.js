import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import ComplaintCard from '../../components/ComplaintCard/ComplaintCard';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getComplaints, getComplaintStats } from '../../services/complaintService';
import { getUpcomingCollections } from '../../services/scheduleService';
import { QUICK_ACTIONS } from '../../constants/data';

const { width } = Dimensions.get('window');

const QuickActionCard = ({ action, onPress, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, delay, tension: 60, friction: 7, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: action.bg }]} onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.qaIconBg, { backgroundColor: action.color + '20' }]}>
          <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
        </View>
        <Text style={[styles.qaTitle, { color: action.color }]}>{action.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 👋';
  if (h < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0.8] });
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [nextCollection, setNextCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [complaintsData, statsData, scheduleData] = await Promise.allSettled([
        getComplaints(),
        getComplaintStats(),
        getUpcomingCollections(),
      ]);
      if (complaintsData.status === 'fulfilled') setComplaints(complaintsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (scheduleData.status === 'fulfilled' && scheduleData.value?.length > 0) {
        setNextCollection(scheduleData.value[0]);
      }
    } catch (e) {
      console.warn('HomeScreen load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const recentComplaints = complaints.slice(0, 2);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ opacity: headerOpacity }}>
        <LinearGradient colors={Colors.gradientDark} style={styles.header}>
          <View style={styles.headerCircle} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'Welcome'}</Text>
              <View style={styles.areaChip}>
                <MaterialCommunityIcons name="map-marker" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.areaText}>{user?.area || 'Zone A'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Collection Status */}
          <TouchableOpacity style={[styles.collectionCard, Shadows.md]} onPress={() => navigation.navigate('LiveTracking')} activeOpacity={0.9}>
            <View style={styles.collectionLeft}>
              <View style={styles.collectionIconBg}>
                <MaterialCommunityIcons name="truck-fast" size={22} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.collectionLabel}>Today's Collection</Text>
                <Text style={styles.collectionTime}>
                  {nextCollection?.isToday ? nextCollection.timeSlot : 'Tap to track truck'}
                </Text>
              </View>
            </View>
            <View style={styles.etaChip}>
              <MaterialCommunityIcons name="timer-outline" size={12} color={Colors.primary} />
              <Text style={styles.etaText}>Track</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, Shadows.sm]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{loading ? '—' : stats.total}</Text>
            <Text style={styles.statLabel}>Complaints</Text>
          </View>
          <View style={[styles.statCard, Shadows.sm]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '15' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{loading ? '—' : stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={[styles.statCard, Shadows.sm]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warning + '15' }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{loading ? '—' : stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <QuickActionCard
              key={action.id}
              action={action}
              delay={i * 80}
              onPress={() => navigation.navigate(action.route)}
            />
          ))}
        </View>

        {/* Next Collection Banner */}
        {nextCollection && (
          <TouchableOpacity style={[styles.nearbyBanner, Shadows.md]} onPress={() => navigation.navigate('CollectionSchedule')} activeOpacity={0.9}>
            <LinearGradient colors={[Colors.accent, '#FF8F00']} style={styles.nearbyGradient}>
              <View style={styles.nearbyLeft}>
                <MaterialCommunityIcons name="calendar-clock" size={28} color="#fff" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.nearbyTitle}>
                    {nextCollection.isToday ? 'Collection Today!' : `Next: ${nextCollection.nextDay}`}
                  </Text>
                  <Text style={styles.nearbySubtitle}>
                    {nextCollection.type} • {nextCollection.timeSlot}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recent Complaints */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ComplaintHistory')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : recentComplaints.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No complaints yet</Text>
          </View>
        ) : (
          recentComplaints.map(c => (
            <ComplaintCard
              key={c._id}
              complaint={{ ...c, id: c._id, status: c.status === 'in_progress' ? 'In Progress' : c.status === 'open' ? 'Pending' : c.status === 'resolved' ? 'Completed' : c.status }}
              onPress={() => navigation.navigate('ComplaintDetails', { complaint: c })}
            />
          ))
        )}

        {/* Report CTA */}
        <TouchableOpacity style={[styles.reportCta, Shadows.primary]} onPress={() => navigation.navigate('ReportComplaint')} activeOpacity={0.9}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.reportCtaGradient}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#fff" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.reportCtaTitle}>See something wrong?</Text>
              <Text style={styles.reportCtaSubtitle}>Report a complaint instantly</Text>
            </View>
            <View style={styles.reportBtn}>
              <Text style={styles.reportBtnText}>Report</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingBottom: 28, overflow: 'hidden' },
  headerCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40 },
  headerCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 10, left: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  greeting: { ...textStyles.body, color: 'rgba(255,255,255,0.8)' },
  userName: { ...textStyles.h4, color: '#fff', marginVertical: 2 },
  areaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2 },
  areaText: { ...textStyles.caption, color: 'rgba(255,255,255,0.85)' },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  notifBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary },
  notifBadgeText: { ...textStyles.caption, color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },
  collectionCard: { backgroundColor: '#fff', borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, marginTop: 4 },
  collectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  collectionIconBg: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primarySurface, justifyContent: 'center', alignItems: 'center' },
  collectionLabel: { ...textStyles.labelLarge, color: Colors.textPrimary },
  collectionTime: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  etaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  etaText: { ...textStyles.labelSmall, color: Colors.primary },
  scrollContent: { padding: Spacing.base, paddingTop: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { ...textStyles.h5, color: Colors.textPrimary },
  statLabel: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAllText: { ...textStyles.label, color: Colors.primary },
  quickActionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  quickActionCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', flex: 1, minHeight: 90 },
  qaIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  qaTitle: { ...textStyles.caption, textAlign: 'center', fontFamily: 'Poppins_600SemiBold' },
  nearbyBanner: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.xl },
  nearbyGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base },
  nearbyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nearbyTitle: { ...textStyles.h6, color: '#fff' },
  nearbySubtitle: { ...textStyles.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  reportCta: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  reportCtaGradient: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  reportCtaTitle: { ...textStyles.labelLarge, color: '#fff' },
  reportCtaSubtitle: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  reportBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 6 },
  reportBtnText: { ...textStyles.button, color: '#fff', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { ...textStyles.body, color: Colors.textTertiary, marginTop: 8 },
});

export default HomeScreen;
