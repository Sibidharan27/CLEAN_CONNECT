import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getComplaintStats } from '../../services/complaintService';
import { authRequest } from '../../services/api';

const SETTINGS = [
  { id: 'notif', icon: 'bell-outline', label: 'Push Notifications', defaultValue: true },
  { id: 'collection', icon: 'calendar-clock', label: 'Collection Reminders', defaultValue: true },
  { id: 'tracking', icon: 'truck-fast', label: 'Truck Nearby Alerts', defaultValue: true },
  { id: 'sms', icon: 'message-outline', label: 'SMS Notifications', defaultValue: false },
];

const formatJoinDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch { return 'Recently'; }
};

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({ visible, user, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.street || 'PSG Tech College Road');
  const [zone, setZone] = useState(user?.zone || 'Peelamedu – PSG Zone');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(user?.name || '');
      setPhone(user?.phone || '');
      setStreet(user?.street || 'PSG Tech College Road');
      setZone(user?.zone || 'Peelamedu – PSG Zone');
      setAddress(user?.address || '');
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required.'); return; }
    setSaving(true);
    try {
      const updated = await authRequest('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          area: 'Peelamedu',
          zone: zone.trim(),
          street: street.trim(),
          address: address.trim(),
        }),
      });
      // Save updated user to local cache
      await AsyncStorage.setItem('@cleanconnect:user', JSON.stringify(updated.user || updated));
      onSave(updated.user || updated);
      Alert.alert('Saved ✅', 'Your profile has been updated.');
    } catch (e) {
      const localUpdate = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        area: 'Peelamedu',
        zone: zone.trim(),
        street: street.trim(),
        address: address.trim(),
      };
      await AsyncStorage.setItem('@cleanconnect:user', JSON.stringify(localUpdate));
      onSave(localUpdate);
      Alert.alert('Saved ✅', 'Profile updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Citizen Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {[
            { label: 'Full Name *', value: name, setter: setName, icon: 'account-outline', placeholder: 'Enter your name' },
            { label: 'Phone Number', value: phone, setter: setPhone, icon: 'phone-outline', placeholder: '+91 XXXXX XXXXX', keyboardType: 'phone-pad' },
            { label: 'Street in Peelamedu', value: street, setter: setStreet, icon: 'road-variant', placeholder: 'e.g. PSG Tech College Road' },
            { label: 'Collection Zone', value: zone, setter: setZone, icon: 'map-marker-radius', placeholder: 'e.g. Peelamedu – PSG Zone' },
            { label: 'Detailed Address', value: address, setter: setAddress, icon: 'home-outline', placeholder: 'Your door no, building, road', multiline: true },
          ].map(field => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name={field.icon} size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.textInput, field.multiline && { height: 60, textAlignVertical: 'top' }]}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType={field.keyboardType || 'default'}
                  multiline={field.multiline}
                  autoCapitalize={field.label.includes('Phone') ? 'none' : 'words'}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient colors={Colors.gradientPrimary} style={styles.saveBtnGradient}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
              )}
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main Profile Screen ───────────────────────────────────────────────────────
const Profile = ({ navigation }) => {
  const { user, logout, setUser } = useAuth();
  const [toggles, setToggles] = useState(
    SETTINGS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultValue }), {})
  );
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

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
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleProfileSaved = (updatedUser) => {
    setUser(updatedUser);
    setEditModalVisible(false);
  };

  const handleMenuPress = (id) => {
    switch (id) {
      case 'edit':
        setEditModalVisible(true);
        break;
      case 'area':
        navigation.navigate('CollectionSchedule');
        break;
      case 'history':
        navigation.navigate('ComplaintHistory');
        break;
      case 'help':
        Alert.alert(
          'Help & Support',
          'For assistance, contact us:\n\n📞 Helpline: 1800-123-4567\n📧 support@cleanconnect.gov.in\n\nAvailable Monday–Saturday, 9 AM – 6 PM',
          [
            { text: 'Call Now', onPress: () => Linking.openURL('tel:18001234567') },
            { text: 'Close', style: 'cancel' },
          ]
        );
        break;
      case 'privacy':
        Alert.alert(
          'Privacy & Security',
          'CleanConnect+ is committed to protecting your privacy.\n\n• Location data is only used for truck tracking.\n• Complaint photos are stored securely.\n• We never share your data with third parties.\n• Contact support to delete your account.',
          [{ text: 'Understood' }]
        );
        break;
      case 'about':
        Alert.alert(
          'About CleanConnect+',
          'Version: 1.0.0\n\nCleanConnect+ is a smart waste management platform by the Municipal Corporation of Coimbatore.\n\nReport waste issues, track collection trucks in real time, and stay informed about collection schedules.',
          [{ text: 'Close' }]
        );
        break;
      default: break;
    }
  };

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  const displayName = user?.name || 'Citizen';
  const displayEmail = user?.email || '—';
  const displayPhone = user?.phone || 'Not set — tap Edit to add';
  const displayStreet = user?.street || 'PSG Tech College Road';
  const displayZone = user?.zone || 'Peelamedu – PSG Zone';
  const displayAddress = user?.address || '12, PSG Tech College Road, Peelamedu';
  const memberSince = formatJoinDate(user?.createdAt);

  const MENU_ITEMS = [
    { id: 'edit', icon: 'account-edit-outline', label: 'Edit Profile & Street', color: Colors.primary },
    { id: 'area', icon: 'calendar-month-outline', label: 'My Collection Schedule', color: Colors.info },
    { id: 'history', icon: 'history', label: 'Complaint History', color: Colors.warning },
    { id: 'privacy', icon: 'shield-lock-outline', label: 'Privacy & Security', color: Colors.textSecondary },
    { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', color: Colors.textSecondary },
    { id: 'about', icon: 'information-outline', label: 'About App', color: Colors.textSecondary },
  ];

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* ── Profile Header ── */}
        <LinearGradient colors={Colors.gradientDark} style={styles.headerGradient}>
          <View style={styles.headerCircle} />
          <TouchableOpacity style={styles.avatarContainer} onPress={() => setEditModalVisible(true)}>
            <LinearGradient colors={['#fff', '#E8F5E9']} style={styles.avatar}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.editAvatarBtn}>
              <MaterialCommunityIcons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          <View style={styles.memberChip}>
            <MaterialCommunityIcons name="shield-check" size={12} color={Colors.accent} />
            <Text style={styles.memberText}>Peelamedu Citizen • Member since {memberSince}</Text>
          </View>
        </LinearGradient>

        {/* ── Stats Row ── */}
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

        {/* ── Personal Info ── */}
        <View style={[styles.section, Shadows.sm]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Location & Personal Information</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editInlineBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.primary} />
              <Text style={styles.editInlineText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {[
            { icon: 'map-marker-radius', label: 'Collection Zone', value: displayZone },
            { icon: 'road-variant', label: 'Assigned Street', value: displayStreet },
            { icon: 'home-outline', label: 'Residential Address', value: displayAddress },
            { icon: 'phone-outline', label: 'Phone', value: displayPhone },
            { icon: 'email-outline', label: 'Email', value: displayEmail },
          ].map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.infoRow}>
                <View style={[styles.infoIconBg, { backgroundColor: Colors.primarySurface }]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={[styles.infoValue, item.value.includes('Not set') && { color: Colors.textTertiary, fontStyle: 'italic' }]}>
                    {item.value}
                  </Text>
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

        <Text style={styles.version}>CleanConnect+ v1.0.0 • Municipal Corporation of Coimbatore</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <EditProfileModal
        visible={editModalVisible}
        user={user}
        onClose={() => setEditModalVisible(false)}
        onSave={handleProfileSaved}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, overflow: 'hidden' },
  headerCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -40, right: -40 },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarInitial: { fontSize: 42, fontFamily: 'Poppins_700Bold', color: Colors.primary },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { ...textStyles.h4, color: '#fff', marginBottom: 4 },
  userEmail: { ...textStyles.body, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  memberText: { ...textStyles.caption, color: 'rgba(255,255,255,0.9)' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, marginTop: -20 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  statValue: { ...textStyles.h5, marginTop: 4 },
  statLabel: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.base, marginBottom: Spacing.md, padding: Spacing.base },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  editInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  editInlineText: { ...textStyles.caption, color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { ...textStyles.caption, color: Colors.textTertiary },
  infoValue: { ...textStyles.body, color: Colors.textPrimary, marginTop: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingLabel: { ...textStyles.body, color: Colors.textPrimary, flex: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  menuIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { ...textStyles.body, color: Colors.textPrimary, flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginHorizontal: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.danger + '30' },
  logoutText: { ...textStyles.labelLarge, color: Colors.danger },
  version: { ...textStyles.caption, color: Colors.textTertiary, textAlign: 'center', marginBottom: Spacing.base },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  modalTitle: { ...textStyles.h5, color: Colors.textPrimary },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { ...textStyles.caption, color: Colors.textSecondary, marginBottom: 6, fontFamily: 'Poppins_600SemiBold' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1.5, borderColor: Colors.border },
  textInput: { flex: 1, ...textStyles.body, color: Colors.textPrimary, paddingVertical: Spacing.md, fontFamily: 'Poppins_400Regular' },
  saveBtn: { marginTop: Spacing.sm, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md },
  saveBtnText: { ...textStyles.button, color: '#fff' },
});

export default Profile;
