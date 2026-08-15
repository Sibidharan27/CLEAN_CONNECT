import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getComplaintStats } from '../../services/complaintService';

const SETTINGS = [
  { id: 'notif', icon: 'bell-outline', label: 'Push Notifications', type: 'toggle', defaultValue: true },
  { id: 'collection', icon: 'calendar-clock', label: 'Collection Reminders', type: 'toggle', defaultValue: true },
  { id: 'tracking', icon: 'truck-fast', label: 'Truck Nearby Alerts', type: 'toggle', defaultValue: true },
  { id: 'sms', icon: 'message-outline', label: 'SMS Notifications', type: 'toggle', defaultValue: false },
];

const MENU_ITEMS = [
  { id: 'edit', icon: 'account-edit-outline', label: 'Edit Profile', color: Colors.primary },
  { id: 'area', icon: 'map-marker-outline', label: 'Change Service Area', color: Colors.info },
  { id: 'history', icon: 'history', label: 'Complaint History', color: Colors.warning },
  { id: 'privacy', icon: 'shield-lock-outline', label: 'Privacy & Security', color: Colors.textSecondary },
  { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', color: Colors.textSecondary },
  { id: 'about', icon: 'information-outline', label: 'About App', color: Colors.textSecondary },
];

// Format "2024-01-15T..." to "January 2024"
const formatJoinDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch { return 'Recently'; }
};

const Profile = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [toggles, setToggles] = useState(
    SETTINGS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultValue }), {})
  );
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await getComplaintStats();
      setStats(data);
    } catch (e) {
      console.warn('Profile stats error:', e.message);
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, []);

  const handleToggle = (id) => setToggles(prev => ({ ...prev, [id]: !prev[id] }));

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
    if (id === 'history') navigation.navigate('ComplaintHistory');
  };

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  // ── Real user data from auth context ───────────────────────────────────────
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '—';
  const displayPhone = user?.phone || 'Not provided';
  const displayArea = user?.area || 'Not set';
  const displayAddress = user?.address || 'Not provided';
  const memberSince = formatJoinDate(user?.createdAt);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {/* ── Profile Header ── */}
      <LinearGradient colors={Colors.gradientDark} style={styles.headerGradient}>
        <View style={styles.headerCircle} />
        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#fff', '#E8F5E9']} style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <TouchableOpacity style={styles.editAvatarBtn}>
            <MaterialCommunityIcons name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{displayEmail}</Text>
        <View style={styles.memberChip}>
          <MaterialCommunityIcons name="shield-check" size={12} color={Colors.accent} />
          <Text style={styles.memberText}>Member since {memberSince}</Text>
        </View>
      </LinearGradient>

      {/* ── Stats Row (Real API data) ── */}
      <View style={styles.statsRow}>
        {[
          { value: statsLoading ? '—' : stats.total, label: 'Raised', icon: 'clipboard-list-outline', color: Colors.primary },
          { value: statsLoading ? '—' : stats.resolved, label: 'Resolved', icon: 'check-circle-outline', color: Colors.success },
          { value: statsLoading ? '—' : stats.pending, label: 'Pending', icon: 'clock-outline', color: Colors.warning },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, Shadows.sm]}>
            <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Personal Info (Real user data) ── */}
      <View style={[styles.section, Shadows.sm]}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {[
          { icon: 'email-outline', label: 'Email', value: displayEmail },
          { icon: 'phone-outline', label: 'Phone', value: displayPhone },
          { icon: 'map-marker-outline', label: 'Service Area', value: displayArea },
          { icon: 'home-outline', label: 'Address', value: displayAddress },
        ].map((item, i) => (
          <View key={item.label}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: Colors.primarySurface }]}>
                <MaterialCommunityIcons name={item.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── Notification Settings ── */}
      <View style={[styles.section, Shadows.sm]}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        {SETTINGS.map((s, i) => (
          <View key={s.id}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.settingRow}>
              <View style={[styles.settingIconBg, { backgroundColor: Colors.primarySurface }]}>
                <MaterialCommunityIcons name={s.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.settingLabel}>{s.label}</Text>
              <Switch
                value={toggles[s.id]}
                onValueChange={() => handleToggle(s.id)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={toggles[s.id] ? Colors.primary : '#fff'}
              />
            </View>
          </View>
        ))}
      </View>

      {/* ── Menu Items ── */}
      <View style={[styles.section, Shadows.sm]}>
        {MENU_ITEMS.map((item, i) => (
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

      <Text style={styles.version}>CleanConnect+ v1.0.0 • Municipal Corporation of Chennai</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    alignItems: 'center', paddingTop: 60, paddingBottom: 40, overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -40, right: -40,
  },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitial: {
    fontSize: 42, fontFamily: 'Poppins_700Bold', color: Colors.primary,
  },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  userName: { ...textStyles.h4, color: '#fff', marginBottom: 4 },
  userEmail: { ...textStyles.body, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4,
  },
  memberText: { ...textStyles.caption, color: 'rgba(255,255,255,0.9)' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, marginTop: -20 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { ...textStyles.h5, marginTop: 4 },
  statLabel: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base, marginBottom: Spacing.md, padding: Spacing.base,
  },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { ...textStyles.caption, color: Colors.textTertiary },
  infoValue: { ...textStyles.body, color: Colors.textPrimary, marginTop: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingLabel: { ...textStyles.body, color: Colors.textPrimary, flex: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
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

export default Profile;
