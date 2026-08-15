import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getDriverStats } from '../../services/scheduleService';

// Format createdAt ISO date → "March 2022"
const formatJoinDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch { return 'Recently'; }
};

const DriverProfile = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState({ completed: 0, totalStops: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await getDriverStats();
      setStats(data);
    } catch (e) {
      console.warn('Driver profile stats error:', e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, []);

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

  const handleMenuPress = (id) => {
    switch (id) {
      case 'history':
        navigation.navigate('CompletedCollections');
        break;
      case 'performance':
        Alert.alert(
          'Performance Report',
          `Today's Stats:\n✅ Completed: ${stats.completed} stops\n📍 Total: ${stats.totalStops} stops\n📊 Completion Rate: ${stats.totalStops > 0 ? Math.round((stats.completed / stats.totalStops) * 100) : 0}%`,
          [{ text: 'Close' }]
        );
        break;
      case 'help':
        Alert.alert(
          'Help & Support',
          'For driver support, contact:\n\n📞 Dispatch: 1800-123-4568\n📧 driver.support@cleanconnect.gov.in\n\nAvailable 24/7 for route-related issues.',
          [
            { text: 'Call Dispatch', onPress: () => Linking.openURL('tel:18001234568') },
            { text: 'Close', style: 'cancel' },
          ]
        );
        break;
      case 'privacy':
        Alert.alert(
          'Privacy & Security',
          'Your location data is only shared while your route is active.\n\nYour data is protected under the Municipal Corporation privacy policy.',
          [{ text: 'Understood' }]
        );
        break;
      default:
        break;
    }
  };

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  // ── Real user data from auth context ────────────────────────────────────────
  const displayName = user?.name || 'Driver';
  const displayEmail = user?.email || '—';
  const displayPhone = user?.phone || 'Not provided';
  const displayEmployeeId = user?.employeeId || user?.email?.split('@')[0]?.toUpperCase() || '—';
  const displayVehicle = user?.vehicleId || 'GCT-001';
  const displayZone = user?.zone || 'Coimbatore Zone A';
  const displayShift = user?.shift || '6:00 AM – 2:00 PM';
  const displayJoining = user?.joiningDate || formatJoinDate(user?.createdAt);
  const joinYear = user?.joiningDate
    ? parseInt(user.joiningDate.split(' ').pop()) || new Date().getFullYear()
    : new Date(user?.createdAt || Date.now()).getFullYear();
  const experienceYears = Math.max(0, new Date().getFullYear() - joinYear);
  const experienceStr = experienceYears === 0 ? '< 1 yr' : `${experienceYears} yr${experienceYears > 1 ? 's' : ''}`;

  const QUICK_LINKS = [
    { id: 'history', icon: 'history', label: 'Collection History', color: Colors.primary },
    { id: 'performance', icon: 'chart-bar', label: 'Performance Report', color: Colors.info },
    { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', color: Colors.textSecondary },
    { id: 'privacy', icon: 'shield-lock-outline', label: 'Privacy & Security', color: Colors.textSecondary },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
    >
      {/* ── Header ── */}
      <LinearGradient colors={['#0D47A1', '#1565C0', '#1976D2']} style={styles.headerGradient}>
        <View style={styles.headerCircle} />

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#fff', '#E3F2FD']} style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={[styles.statusIndicator, isAvailable && styles.statusIndicatorActive]} />
        </View>

        <Text style={styles.driverName}>{displayName}</Text>
        <Text style={styles.employeeId}>{displayEmployeeId}</Text>

        {/* Availability Toggle */}
        <View style={styles.availabilityRow}>
          <Text style={styles.availabilityLabel}>{isAvailable ? '🟢 Available' : '🔴 Offline'}</Text>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent + 'AA' }}
            thumbColor={isAvailable ? Colors.accent : 'rgba(255,255,255,0.6)'}
          />
        </View>
      </LinearGradient>

      {/* ── Stats Row (Real API data) ── */}
      <View style={styles.statsRow}>
        {[
          { value: stats.completed, label: "Today's Done", icon: 'check-circle-outline', color: Colors.success },
          { value: stats.totalStops, label: "Today's Total", icon: 'map-marker-multiple-outline', color: Colors.info },
          { value: experienceStr, label: 'Experience', icon: 'calendar-outline', color: Colors.warning },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, Shadows.sm]}>
            <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Vehicle Info ── */}
      <View style={[styles.section, Shadows.sm]}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="truck-outline" size={20} color={Colors.info} />
          <Text style={styles.sectionTitle}>Vehicle & Route Details</Text>
        </View>
        {[
          { icon: 'card-text-outline', label: 'Vehicle ID', value: displayVehicle },
          { icon: 'truck', label: 'Vehicle Type', value: 'Compactor Truck' },
          { icon: 'map-marker-radius-outline', label: 'Zone', value: displayZone },
          { icon: 'clock-time-eight-outline', label: 'Shift', value: displayShift },
        ].map((item, i) => (
          <View key={item.label}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBg}>
                <MaterialCommunityIcons name={item.icon} size={16} color={Colors.info} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── Personal Info ── */}
      <View style={[styles.section, Shadows.sm]}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="account-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>
        {[
          { icon: 'email-outline', label: 'Email', value: displayEmail },
          { icon: 'phone-outline', label: 'Phone', value: displayPhone },
          { icon: 'calendar-outline', label: 'Joining Date', value: displayJoining },
        ].map((item, i) => (
          <View key={item.label}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: Colors.primarySurface }]}>
                <MaterialCommunityIcons name={item.icon} size={16} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── Quick Links ── */}
      <View style={[styles.section, Shadows.sm]}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="view-grid-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.sectionTitle}>Quick Links</Text>
        </View>
        {QUICK_LINKS.map((item, i) => (
          <View key={item.id}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleMenuPress(item.id)}>
              <View style={[styles.menuIconBg, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={[styles.logoutBtn, Shadows.sm]} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>CleanConnect+ Driver v1.0.0 • Municipal Corporation of Coimbatore</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, overflow: 'hidden' },
  headerCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -40, right: -40,
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitial: { fontSize: 42, fontFamily: 'Poppins_700Bold', color: '#1565C0' },
  statusIndicator: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.textTertiary, borderWidth: 2.5, borderColor: '#fff',
  },
  statusIndicatorActive: { backgroundColor: Colors.success },
  driverName: { ...textStyles.h4, color: '#fff', marginBottom: 4 },
  employeeId: { ...textStyles.body, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  availabilityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  availabilityLabel: { ...textStyles.label, color: '#fff' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, marginTop: -20 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { ...textStyles.h5, marginTop: 4 },
  statLabel: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base, marginBottom: Spacing.md, padding: Spacing.base,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconBg: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.infoSurface, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { ...textStyles.caption, color: Colors.textTertiary },
  infoValue: { ...textStyles.body, color: Colors.textPrimary, marginTop: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  menuIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { ...textStyles.body, color: Colors.textPrimary, flex: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.danger + '30',
  },
  logoutText: { ...textStyles.labelLarge, color: Colors.danger },
  version: { ...textStyles.caption, color: Colors.textTertiary, textAlign: 'center', marginBottom: Spacing.base },
});

export default DriverProfile;
