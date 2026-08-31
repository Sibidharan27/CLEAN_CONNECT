import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import InputField from '../../components/Input/InputField';
import PrimaryButton from '../../components/Button/PrimaryButton';
import StatusBadge from '../../components/Card/StatusBadge';
import { getDriverRoutes } from '../../services/scheduleService';
import { useLocation } from '../../context/LocationContext';

const COMPLETION_RADIUS_KM = 0.3; // 300 metres

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Collection History List View (when opened as a Tab) ────────────────────
const CollectionHistoryTab = ({ navigation }) => {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDriverRoutes();
      const completedStops = (data?.stops || []).filter(s => s.status === 'completed');
      setStops(completedStops);
    } catch (e) {
      console.warn('CompletedCollections error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1, marginTop: 60 }} />;

  return (
    <View style={styles.container}>
      <Header title="Completed Collections" subtitle={`${stops.length} stops done today`} />
      <FlatList
        data={stops}
        keyExtractor={s => s._id || String(s.stopNumber)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-check-multiple-outline" size={52} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No completed stops yet</Text>
            <Text style={styles.emptySubtitle}>Stops you complete will appear here</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.historyCard, Shadows.sm]}>
            <View style={[styles.historyIconBg, { backgroundColor: Colors.successSurface }]}>
              <MaterialCommunityIcons name="check-circle" size={22} color={Colors.success} />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyAddress} numberOfLines={1}>{item.address}</Text>
              <Text style={styles.historyLandmark}>{item.landmark}</Text>
              {item.completedAt && (
                <Text style={styles.historyTime}>
                  ✓ Done at {new Date(item.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
            <View style={styles.historyStopBadge}>
              <Text style={styles.historyStopNum}>#{item.stopNumber}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
};

// ─── Detail View (when opened from navigation with a complaint param) ─────────
const CollectionDetailView = ({ navigation, complaint }) => {
  const { location, getCurrentLocation } = useLocation();
  const [remarks, setRemarks] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handlePhotoCapture = () => {
    Alert.alert('Capture Photo', 'Take a photo of the collection', [
      { text: 'Camera', onPress: () => setHasPhoto(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMarkComplete = async () => {
    if (!hasPhoto) {
      Alert.alert('Photo Required', 'Please capture a photo before marking as complete.');
      return;
    }

    // Geofence check: must be within 300m of the collection location
    const targetLat = complaint.latitude || complaint.location?.latitude;
    const targetLon = complaint.longitude || complaint.location?.longitude;

    if (targetLat && targetLon) {
      let driverLoc = location;
      if (!driverLoc) {
        try {
          driverLoc = await getCurrentLocation();
        } catch {
          Alert.alert(
            '📍 Location Required',
            'GPS location is required to verify you are at the collection location before marking as completed.'
          );
          return;
        }
      }

      if (driverLoc?.latitude && driverLoc?.longitude) {
        const dist = haversineKm(
          driverLoc.latitude, driverLoc.longitude,
          targetLat, targetLon
        );
        if (dist > COMPLETION_RADIUS_KM) {
          const distMetres = Math.round(dist * 1000);
          Alert.alert(
            '📍 Too Far Away',
            `You are ${distMetres}m away from the collection location.\n\nYou must be within 300m to mark it as completed.\n\nPlease drive to the location first.`,
            [{ text: 'Understood' }]
          );
          return;
        }
      }
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    setCompleted(true);
  };

  if (completed) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={Colors.gradientPrimary} style={styles.successBg} />
        <View style={[styles.successCard, Shadows.xl]}>
          <View style={styles.successIconBg}>
            <MaterialCommunityIcons name="check-circle" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Collection Marked!</Text>
          <Text style={styles.successSubtitle}>
            Complaint {complaint.id} has been marked as completed. Citizen will be notified automatically.
          </Text>
          <View style={styles.successMeta}>
            <View style={styles.successMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.successMetaText}>Resolved at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
          <PrimaryButton title="Back to Dashboard" onPress={() => navigation.goBack()} style={{ marginBottom: Spacing.sm }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Header title="Update Collection" subtitle="Mark stop as completed" showBack onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.complaintCard, Shadows.md]}>
            <View style={styles.complaintHeader}>
              <View style={styles.complaintIconBg}>
                <MaterialCommunityIcons name={complaint.categoryIcon || 'alert-circle-outline'} size={22} color={Colors.primary} />
              </View>
              <View style={styles.complaintInfo}>
                <Text style={styles.complaintTitle}>{complaint.title}</Text>
                <Text style={styles.complaintId}>{complaint.id}</Text>
              </View>
              <StatusBadge status={complaint.status} size="small" />
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.primary} />
              <Text style={styles.locationText}>{complaint.location}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Capture Collection Photo *</Text>
          <TouchableOpacity style={[styles.photoBtn, hasPhoto && styles.photoBtnSuccess, Shadows.sm]} onPress={handlePhotoCapture} activeOpacity={0.8}>
            {hasPhoto ? (
              <LinearGradient colors={Colors.gradientPrimary} style={styles.photoBtnContent}>
                <MaterialCommunityIcons name="image-check" size={32} color="#fff" />
                <Text style={styles.photoSuccessText}>Photo Captured ✓</Text>
                <Text style={styles.photoRetakeText}>Tap to retake</Text>
              </LinearGradient>
            ) : (
              <View style={styles.photoBtnContent}>
                <View style={styles.cameraIconBg}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.photoPromptText}>Take Photo</Text>
                <Text style={styles.photoPromptSub}>Required for completion</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Collection Checklist</Text>
          <View style={[styles.checklistCard, Shadows.sm]}>
            {['All bins emptied from location', 'Area cleaned after collection', 'No waste left behind', 'Bin lids properly closed'].map((item, i) => (
              <View key={i} style={[styles.checkItem, i > 0 && styles.checkItemBorder]}>
                <MaterialCommunityIcons name="checkbox-marked-circle" size={20} color={Colors.success} />
                <Text style={styles.checkItemText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Remarks (Optional)</Text>
          <InputField value={remarks} onChangeText={setRemarks} placeholder="Add any additional notes..." multiline numberOfLines={3} icon="note-text-outline" autoCapitalize="sentences" />

          <PrimaryButton title="Mark Collection Complete" onPress={handleMarkComplete} loading={isLoading}
            icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />}
            style={{ marginTop: Spacing.sm }} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Main Component — routes to detail or history ────────────────────────────
const CompletedCollections = ({ navigation, route }) => {
  const complaint = route?.params?.complaint;

  // If opened with a specific complaint (from LiveNavigation/AssignedRoutes), show detail
  if (complaint) {
    return <CollectionDetailView navigation={navigation} complaint={complaint} />;
  }

  // Otherwise (opened as Tab) — show history list
  return <CollectionHistoryTab navigation={navigation} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base },
  listContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },

  // History list styles
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  historyIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyInfo: { flex: 1 },
  historyAddress: { ...textStyles.labelLarge, color: Colors.textPrimary },
  historyLandmark: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  historyTime: { ...textStyles.caption, color: Colors.success, marginTop: 4 },
  historyStopBadge: { backgroundColor: Colors.successSurface, borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  historyStopNum: { ...textStyles.label, color: Colors.success, fontFamily: 'Poppins_700Bold' },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...textStyles.h6, color: Colors.textSecondary, marginTop: 16 },
  emptySubtitle: { ...textStyles.body, color: Colors.textTertiary, marginTop: 6, textAlign: 'center' },

  // Detail form styles
  complaintCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.xl },
  complaintHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  complaintIconBg: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primarySurface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  complaintInfo: { flex: 1 },
  complaintTitle: { ...textStyles.labelLarge, color: Colors.textPrimary },
  complaintId: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  locationText: { ...textStyles.bodySmall, color: Colors.textSecondary, flex: 1 },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.sm },
  photoBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.xl, borderWidth: 2, borderColor: Colors.primaryLight, borderStyle: 'dashed' },
  photoBtnSuccess: { borderStyle: 'solid', borderColor: 'transparent' },
  photoBtnContent: { height: 140, alignItems: 'center', justifyContent: 'center', padding: Spacing.base },
  cameraIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  photoPromptText: { ...textStyles.labelLarge, color: Colors.primary },
  photoPromptSub: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 4 },
  photoSuccessText: { ...textStyles.h6, color: '#fff', marginTop: 8 },
  photoRetakeText: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  checklistCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.xl },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: Spacing.sm },
  checkItemBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  checkItemText: { ...textStyles.body, color: Colors.textPrimary },

  // Success screen styles
  successContainer: { flex: 1 },
  successBg: { ...StyleSheet.absoluteFillObject },
  successCard: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: Spacing.base, padding: Spacing['2xl'], backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'] },
  successIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primarySurface, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  successTitle: { ...textStyles.h3, color: Colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  successSubtitle: { ...textStyles.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  successMeta: { marginBottom: Spacing.xl },
  successMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  successMetaText: { ...textStyles.body, color: Colors.textSecondary },
});

export default CompletedCollections;
