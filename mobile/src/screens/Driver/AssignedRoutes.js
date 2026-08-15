import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import MapCard from '../../components/Map/MapCard';
import { getDriverRoutes, completeStop, startRoute } from '../../services/scheduleService';

const StatusIcon = ({ status }) => {
  const config = {
    Completed: { icon: 'check-circle', color: Colors.success, bg: Colors.successSurface },
    'In Progress': { icon: 'truck-fast', color: Colors.info, bg: Colors.infoSurface },
    Pending: { icon: 'map-marker-outline', color: Colors.textTertiary, bg: Colors.surfaceVariant },
  };
  const c = config[status] || config.Pending;
  return (
    <View style={[styles.statusIcon, { backgroundColor: c.bg }]}>
      <MaterialCommunityIcons name={c.icon} size={18} color={c.color} />
    </View>
  );
};

const AssignedRoutes = ({ navigation }) => {
  const [expandedStop, setExpandedStop] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(null);

  const loadRoutes = useCallback(async () => {
    try {
      const data = await getDriverRoutes();
      setRouteData(data);
      setStops(data?.stops || []);
    } catch (e) {
      console.warn('AssignedRoutes error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRoutes(); }, []);
  const onRefresh = () => { setRefreshing(true); loadRoutes(); };

  const handleCompleteStop = async (stop) => {
    if (!routeData?._id || !stop._id) return;
    Alert.alert('Complete Stop?', `Mark "${stop.address}" as done?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete ✅', onPress: async () => {
          setCompleting(stop._id);
          try {
            const updated = await completeStop(routeData._id, stop._id);
            setStops(updated.stops || []);
            setRouteData(updated);
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setCompleting(null);
          }
        }
      }
    ]);
  };

  const completed = stops.filter(r => r.status === 'completed').length;

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1, marginTop: 60 }} />;

  return (
    <View style={styles.container}>
      <Header
        title="Assigned Route"
        subtitle={`${completed}/${stops.length} stops completed`}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon="navigation-variant-outline"
        onRightPress={() => navigation.navigate('LiveNavigation')}
      />

      {/* Map Preview */}
      <View style={styles.mapContainer}>
        <MapCard
          title="Today's Route"
          subtitle={`${stops.length} stops`}
          height={170}
          stops={stops}
          onPress={() => navigation.navigate('LiveNavigation')}
        />
        <TouchableOpacity
          style={[styles.navigateBtn, Shadows.primary]}
          onPress={() => navigation.navigate('LiveNavigation')}
        >
          <LinearGradient colors={Colors.gradientPrimary} style={styles.navigateBtnGradient}>
            <MaterialCommunityIcons name="navigation-variant" size={18} color="#fff" />
            <Text style={styles.navigateBtnText}>Start Navigation</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Route Progress</Text>
          <Text style={styles.progressValue}>{stops.length > 0 ? Math.round((completed / stops.length) * 100) : 0}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${stops.length > 0 ? (completed / stops.length) * 100 : 0}%` }]} />
        </View>
      </View>

      {/* Stop List */}
      <FlatList
        data={stops}
        keyExtractor={r => r._id || String(r.stopNumber)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        renderItem={({ item, index }) => {
          const isExpanded = expandedStop === (item._id || item.stopNumber);
          const displayStatus = item.status === 'completed' ? 'Completed' : item.status === 'in_progress' ? 'In Progress' : 'Pending';
          return (
            <TouchableOpacity
              style={[styles.stopCard, Shadows.sm, item.status === 'in_progress' && styles.activeStopCard]}
              onPress={() => setExpandedStop(isExpanded ? null : (item._id || item.stopNumber))}
              activeOpacity={0.88}
            >
              <View style={styles.stopHeader}>
                <View style={styles.stopNumberCol}>
                  <View style={[styles.stopNumBadge, item.status === 'completed' && styles.completedNumBadge, item.status === 'in_progress' && styles.activeNumBadge]}>
                    {item.status === 'completed' ? (
                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                    ) : (
                      <Text style={styles.stopNum}>{item.stopNumber}</Text>
                    )}
                  </View>
                  {index < stops.length - 1 && (
                    <View style={[styles.stopLine, item.status === 'completed' && styles.completedLine]} />
                  )}
                </View>

                <View style={styles.stopInfo}>
                  <View style={styles.stopInfoHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopAddress} numberOfLines={1}>{item.address}</Text>
                      <Text style={styles.stopLandmark}>{item.landmark}</Text>
                    </View>
                    <StatusIcon status={displayStatus} />
                  </View>
                  <View style={styles.stopMeta}>
                    {item.complaintsCount > 0 && (
                      <View style={styles.complaintBadge}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={12} color={Colors.danger} />
                        <Text style={styles.complaintBadgeText}>{item.complaintsCount} complaint{item.complaintsCount > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                    {item.completedAt && (
                      <Text style={styles.metaText}>Done at {new Date(item.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                    )}
                  </View>

                  {isExpanded && item.status !== 'completed' && (
                    <View style={styles.expandedActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryAction]}
                        onPress={() => navigation.navigate('LiveNavigation')}
                      >
                        <MaterialCommunityIcons name="navigation-variant" size={16} color="#fff" />
                        <Text style={styles.actionBtnText}>Navigate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.secondaryAction]}
                        onPress={() => handleCompleteStop(item)}
                        disabled={completing === item._id}
                      >
                        {completing === item._id ? (
                          <ActivityIndicator size={14} color={Colors.primary} />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="check-circle-outline" size={16} color={Colors.primary} />
                            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Mark Done</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 40 }}><MaterialCommunityIcons name="map-search-outline" size={48} color={Colors.textTertiary} /><Text style={{ ...textStyles.body, color: Colors.textTertiary, marginTop: 8 }}>No stops assigned today</Text></View>}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm },
  navigateBtn: { marginTop: Spacing.sm, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  navigateBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md,
  },
  navigateBtnText: { ...textStyles.button, color: '#fff' },
  progressContainer: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { ...textStyles.label, color: Colors.textSecondary },
  progressValue: { ...textStyles.label, color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  progressBar: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  listContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  stopCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, overflow: 'hidden' },
  activeStopCard: { borderWidth: 1.5, borderColor: Colors.info + '50', backgroundColor: Colors.infoSurface + '30' },
  stopHeader: { flexDirection: 'row', padding: Spacing.md },
  stopNumberCol: { alignItems: 'center', marginRight: 12, width: 28 },
  stopNumBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center',
  },
  completedNumBadge: { backgroundColor: Colors.success },
  activeNumBadge: { backgroundColor: Colors.info },
  stopNum: { ...textStyles.labelSmall, color: Colors.textSecondary },
  stopLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 4, minHeight: 20 },
  completedLine: { backgroundColor: Colors.success + '40' },
  stopInfo: { flex: 1 },
  stopInfoHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  stopAddress: { ...textStyles.labelLarge, color: Colors.textPrimary },
  stopLandmark: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  statusIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  stopMeta: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...textStyles.caption, color: Colors.textTertiary },
  complaintBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  complaintBadgeText: { ...textStyles.caption, color: Colors.danger },
  expandedActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.sm,
  },
  primaryAction: { backgroundColor: Colors.primary },
  secondaryAction: { backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: Colors.primary + '40' },
  actionBtnText: { ...textStyles.label, color: '#fff' },
});

export default AssignedRoutes;
