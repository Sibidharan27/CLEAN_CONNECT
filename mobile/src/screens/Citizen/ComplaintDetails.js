import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import MapCard from '../../components/Map/MapCard';

const TimelineStep = ({ step, isLast }) => {
  const iconMap = {
    'open': 'clipboard-check-outline',
    'Submitted': 'clipboard-check-outline',
    'reviewing': 'eye-outline',
    'Reviewing': 'eye-outline',
    'in_progress': 'truck-fast',
    'In Progress': 'truck-fast',
    'assigned': 'account-check-outline',
    'resolved': 'check-circle-outline',
    'Completed': 'check-circle-outline',
    'closed': 'archive-outline',
  };
  const colorMap = {
    'open': Colors.info,
    'Submitted': Colors.info,
    'reviewing': Colors.warning,
    'Reviewing': Colors.warning,
    'in_progress': Colors.primary,
    'In Progress': Colors.primary,
    'assigned': Colors.primary,
    'resolved': Colors.success,
    'Completed': Colors.success,
    'closed': Colors.textSecondary,
  };
  const color = colorMap[step.status] || Colors.primary;

  // Format time — handle Date objects and ISO strings
  const formatTime = (t) => {
    if (!t) return '';
    try {
      const d = new Date(t);
      if (!isNaN(d)) return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {}
    return String(t);
  };

  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: color + '20', borderColor: color }]}>
          <MaterialCommunityIcons name={iconMap[step.status] || 'circle'} size={16} color={color} />
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: color + '30' }]} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineStatus, { color }]}>{step.status}</Text>
        <Text style={styles.timelineNote}>{step.note}</Text>
        <Text style={styles.timelineTime}>{formatTime(step.time)}</Text>
      </View>
    </View>
  );
};

// Safely derive display fields from either API format or legacy mock format
const normaliseComplaint = (c) => ({
  id: c._id || c.id || '—',
  title: c.title || 'Complaint',
  category: c.category || '—',
  categoryIcon: c.categoryIcon || 'alert-circle-outline',
  status: (() => {
    const s = c.status || 'open';
    if (s === 'in_progress') return 'In Progress';
    if (s === 'open') return 'Pending';
    if (s === 'resolved') return 'Completed';
    return s;
  })(),
  rawStatus: c.status,
  description: c.description || 'No description provided.',
  location: c.location?.address || c.location || 'Location not specified',
  date: c.date || (c.createdAt ? c.createdAt.split('T')[0] : '—'),
  time: c.time || (c.createdAt ? new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'),
  assignedDriver: c.assignedDriver?.name || c.assignedDriver || null,
  assignedVehicle: c.assignedVehicle || null,
  resolutionNotes: c.resolutionNotes || c.resolutionNote || null,
  timeline: c.timeline || [{ status: c.status || 'open', time: c.createdAt, note: 'Complaint registered.' }],
  latitude: c.location?.latitude || c.latitude || 11.0168,
  longitude: c.location?.longitude || c.longitude || 76.9558,
  area: c.area || c.location?.address?.split(',').pop()?.trim() || 'Coimbatore',
});

const ComplaintDetails = ({ navigation, route }) => {
  const raw = route.params?.complaint;

  if (!raw) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={[textStyles.h6, { color: Colors.textPrimary, marginTop: 12 }]}>Complaint not found</Text>
        <TouchableOpacity style={styles.backFallback} onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const complaint = normaliseComplaint(raw);

  const statusGradient =
    complaint.rawStatus === 'resolved' ? Colors.gradientPrimary
    : complaint.rawStatus === 'in_progress' ? ['#1565C0', '#1976D2']
    : [Colors.warning, Colors.accentDark];

  const statusIcon =
    complaint.rawStatus === 'resolved' ? 'check-circle'
    : complaint.rawStatus === 'in_progress' ? 'truck-fast'
    : 'clock-outline';

  return (
    <View style={styles.container}>
      <Header
        title="Complaint Details"
        subtitle={`#${complaint.id}`}
        showBack
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <LinearGradient colors={statusGradient} style={styles.statusBanner}>
          <View style={styles.bannerLeft}>
            <MaterialCommunityIcons name={statusIcon} size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.bannerStatus}>{complaint.status}</Text>
              <Text style={styles.bannerDate}>Submitted: {complaint.date} at {complaint.time}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main Info Card */}
        <View style={[styles.card, Shadows.md]}>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryIconBg, { backgroundColor: Colors.primarySurface }]}>
              <MaterialCommunityIcons name={complaint.categoryIcon} size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{complaint.title}</Text>
              <Text style={styles.cardCategory}>{complaint.category}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.description}>{complaint.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.primary} />
            <Text style={styles.locationText}>{complaint.location}</Text>
          </View>

          {complaint.assignedDriver && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>ASSIGNED DRIVER</Text>
              <View style={styles.driverCard}>
                <View style={styles.driverAvatar}>
                  <MaterialCommunityIcons name="account" size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.driverName}>{complaint.assignedDriver}</Text>
                  {complaint.assignedVehicle && (
                    <Text style={styles.driverVehicle}>{complaint.assignedVehicle}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.callBtn}>
                  <MaterialCommunityIcons name="phone" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {complaint.resolutionNotes && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>RESOLUTION NOTES</Text>
              <View style={styles.notesBox}>
                <MaterialCommunityIcons name="note-text-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.notesText}>{complaint.resolutionNotes}</Text>
              </View>
            </>
          )}
        </View>

        {/* Map Preview */}
        <Text style={styles.sectionTitle}>Location on Map</Text>
        <MapCard
          title={complaint.area}
          subtitle="Complaint location"
          height={160}
          centerCoord={{ latitude: complaint.latitude, longitude: complaint.longitude }}
        />

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        <View style={[styles.card, Shadows.sm]}>
          {complaint.timeline.length === 0 ? (
            <Text style={[textStyles.body, { color: Colors.textSecondary }]}>No timeline available.</Text>
          ) : (
            complaint.timeline.map((step, i) => (
              <TimelineStep key={i} step={step} isLast={i === complaint.timeline.length - 1} />
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base },
  backFallback: { marginTop: 16, padding: Spacing.md },
  statusBanner: {
    borderRadius: BorderRadius.lg, padding: Spacing.base,
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerStatus: { ...textStyles.h6, color: '#fff' },
  bannerDate: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  categoryIconBg: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { ...textStyles.h6, color: Colors.textPrimary },
  cardCategory: { ...textStyles.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.md },
  sectionLabel: { ...textStyles.overline, color: Colors.textTertiary, marginBottom: 6 },
  description: { ...textStyles.body, color: Colors.textSecondary, lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  locationText: { ...textStyles.body, color: Colors.textPrimary, flex: 1, lineHeight: 22 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  driverAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  driverName: { ...textStyles.labelLarge, color: Colors.textPrimary },
  driverVehicle: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  notesBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm, padding: Spacing.md,
  },
  notesText: { ...textStyles.body, color: Colors.textSecondary, flex: 1, lineHeight: 22 },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.md },
  timelineStep: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { alignItems: 'center', marginRight: 12, width: 36 },
  timelineDot: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, marginTop: 4, minHeight: 20 },
  timelineContent: { flex: 1, paddingBottom: Spacing.base },
  timelineStatus: { ...textStyles.labelLarge },
  timelineNote: { ...textStyles.body, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  timelineTime: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 4 },
});

export default ComplaintDetails;
