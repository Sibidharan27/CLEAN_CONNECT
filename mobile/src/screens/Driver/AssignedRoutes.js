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
  Linking,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import MapCard from '../../components/Map/MapCard';
import { getDriverRoutes, completeStop, startRoute } from '../../services/scheduleService';
import { authRequest, API_URL } from '../../services/api';
import { useLocation } from '../../context/LocationContext';

// Base URL for static image files (strips /api suffix)
const IMG_BASE = API_URL.replace('/api', '');

// ─── Geofence radius in kilometres ───────────────────────────────────────────
const COMPLETION_RADIUS_KM = 0.3; // 300 metres

// ─── Haversine distance helper ───────────────────────────────────────────────
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

// ─── Status icon helper ───────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  const config = {
    Completed: { icon: 'check-circle', color: Colors.success, bg: Colors.successSurface },
    'In Progress': { icon: 'truck-fast', color: Colors.info, bg: Colors.infoSurface },
    Pending: { icon: 'map-marker-outline', color: Colors.textTertiary, bg: Colors.surfaceVariant },
    assigned: { icon: 'account-check-outline', color: '#FF8F00', bg: '#FFF8E1' },
  };
  const c = config[status] || config.Pending;
  return (
    <View style={[styles.statusIcon, { backgroundColor: c.bg }]}>
      <MaterialCommunityIcons name={c.icon} size={18} color={c.color} />
    </View>
  );
};

// ─── Tab toggle ───────────────────────────────────────────────────────────────
const TAB_ROUTE = 'route';
const TAB_COMPLAINTS = 'complaints';

const AssignedRoutes = ({ navigation }) => {
  const { getCurrentLocation, location } = useLocation();
  const [activeTab, setActiveTab] = useState(TAB_ROUTE);

  // Route state
  const [expandedStop, setExpandedStop] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [startingRoute, setStartingRoute] = useState(false);

  // Assigned complaints state
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const loadComplaints = useCallback(async () => {
    setComplaintsLoading(true);
    try {
      const data = await authRequest('/complaints');
      // Filter to only show assigned complaints for this driver
      const assigned = Array.isArray(data)
        ? data.filter(c => ['assigned', 'in_progress'].includes(c.status))
        : [];
      setComplaints(assigned);
    } catch (e) {
      console.warn('Complaints load error:', e.message);
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  // Reload on every focus — keeps in sync with Dashboard start/stop actions
  useFocusEffect(
    useCallback(() => {
      loadRoutes();
      loadComplaints();
      getCurrentLocation().then(loc => setDriverLocation(loc)).catch(() => {});
    }, [loadRoutes, loadComplaints])
  );

  useEffect(() => {
    getCurrentLocation().then(loc => setDriverLocation(loc)).catch(() => {});
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoutes();
    loadComplaints();
    getCurrentLocation().then(loc => setDriverLocation(loc)).catch(() => {});
  };

  // ─── Geofenced complete stop ─────────────────────────────────────────────────
  const handleCompleteStop = async (stop) => {
    if (!routeData?._id || !stop._id) {
      Alert.alert('Error', 'Could not identify this stop. Please refresh.');
      return;
    }

    // Geofence check — stop must have coordinates
    if (stop.latitude && stop.longitude) {
      const currentLoc = driverLocation || location;
      if (currentLoc) {
        const dist = haversineKm(
          currentLoc.latitude, currentLoc.longitude,
          stop.latitude, stop.longitude
        );
        if (dist > COMPLETION_RADIUS_KM) {
          const distMetres = Math.round(dist * 1000);
          Alert.alert(
            '📍 Too Far Away',
            `You are ${distMetres}m from this stop. You need to be within ${COMPLETION_RADIUS_KM * 1000}m to mark it complete.\n\nPlease drive closer to the location.`,
            [
              {
                text: 'Navigate There',
                onPress: () => openNavigation(stop.latitude, stop.longitude, stop.address),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }
      } else {
        // Can't verify location — ask user to allow
        Alert.alert(
          '📍 Location Required',
          'We need your GPS location to verify you are at the stop before marking it complete.',
          [
            {
              text: 'Enable Location',
              onPress: async () => {
                try {
                  const loc = await getCurrentLocation();
                  setDriverLocation(loc);
                } catch { Alert.alert('Error', 'Could not get location. Please try again.'); }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
    }

    Alert.alert('Complete Stop?', `Mark "${stop.address}" as done?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete ✅', onPress: async () => {
          setCompleting(stop._id);
          try {
            const updated = await completeStop(routeData._id, stop._id);
            if (updated?.stops && Array.isArray(updated.stops)) {
              setStops(updated.stops);
              setRouteData(updated);
            } else {
              setStops(prev => prev.map(s =>
                s._id === stop._id ? { ...s, status: 'completed', completedAt: new Date().toISOString() } : s
              ));
            }
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not mark stop as done. Please try again.');
          } finally {
            setCompleting(null);
          }
        }
      }
    ]);
  };

  // ─── Open native navigation (Google Maps / Apple Maps) ──────────────────────
  const openNavigation = (lat, lon, label = '') => {
    const encodedLabel = encodeURIComponent(label || 'Destination');
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    const appleMapsUrl = `maps://?daddr=${lat},${lon}&dirflg=d`;

    Linking.canOpenURL(googleUrl).then(supported => {
      if (supported) {
        Linking.openURL(googleUrl);
      } else {
        Linking.openURL(appleMapsUrl).catch(() =>
          Alert.alert('No Map App', 'Could not open navigation. Please install Google Maps.')
        );
      }
    });
  };

  const completed = stops.filter(r => r.status === 'completed').length;

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1, marginTop: 60 }} />;

  return (
    <View style={styles.container}>
      <Header
        title="My Assignments"
        subtitle={`${completed}/${stops.length} stops • ${complaints.length} complaints`}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon="navigation-variant-outline"
        onRightPress={() => navigation.navigate('LiveNavigation')}
      />

      {/* ─── Tab Switcher ─────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === TAB_ROUTE && styles.tabBtnActive]}
          onPress={() => setActiveTab(TAB_ROUTE)}
        >
          <MaterialCommunityIcons
            name="map-marker-path"
            size={16}
            color={activeTab === TAB_ROUTE ? '#fff' : Colors.textSecondary}
          />
          <Text style={[styles.tabBtnText, activeTab === TAB_ROUTE && styles.tabBtnTextActive]}>
            Route Stops
          </Text>
          {stops.length > 0 && (
            <View style={[styles.tabCount, activeTab === TAB_ROUTE && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === TAB_ROUTE && { color: Colors.primary }]}>
                {stops.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === TAB_COMPLAINTS && styles.tabBtnComplaint]}
          onPress={() => setActiveTab(TAB_COMPLAINTS)}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={16}
            color={activeTab === TAB_COMPLAINTS ? '#fff' : Colors.textSecondary}
          />
          <Text style={[styles.tabBtnText, activeTab === TAB_COMPLAINTS && styles.tabBtnTextActive]}>
            Complaints
          </Text>
          {complaints.length > 0 && (
            <View style={[styles.tabCount, activeTab === TAB_COMPLAINTS && styles.tabCountComplaint]}>
              <Text style={[styles.tabCountText, activeTab === TAB_COMPLAINTS && { color: Colors.danger }]}>
                {complaints.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Route Tab ───────────────────────────────────────── */}
      {activeTab === TAB_ROUTE && (
        <>
          {/* Map Preview */}
          <View style={styles.mapContainer}>
            <MapCard
              title="Today's Route"
              subtitle={`${stops.length} street stops`}
              height={160}
              stops={stops}
              onPress={() => navigation.navigate('LiveNavigation')}
            />
            <View style={styles.navBtnRow}>
              {routeData?.status !== 'active' && (
                <TouchableOpacity
                  style={[styles.startRouteBtn, Shadows.md, startingRoute && { opacity: 0.7 }]}
                  disabled={startingRoute}
                  onPress={async () => {
                    setStartingRoute(true);
                    try {
                      const res = await startRoute(routeData?._id || 'today');
                      // Sync state immediately so button disappears without needing refresh
                      const updated = res || { ...routeData, status: 'active' };
                      setRouteData(updated);
                      if (updated?.stops) setStops(updated.stops);
                      Alert.alert('Route Started! 🚛', 'Your route is now active and broadcasting GPS.');
                    } catch (e) {
                      Alert.alert('Notice', e.message || 'Could not start route.');
                    } finally {
                      setStartingRoute(false);
                    }
                  }}
                >
                  {startingRoute ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="play-circle" size={18} color="#fff" />
                  )}
                  <Text style={styles.startRouteBtnText}>
                    {startingRoute ? 'Starting...' : 'Start Route'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.navigateBtn, Shadows.primary, routeData?.status !== 'active' && { flex: 1.2 }]}
                onPress={() => navigation.navigate('LiveNavigation')}
              >
                <LinearGradient colors={Colors.gradientPrimary} style={styles.navigateBtnGradient}>
                  <MaterialCommunityIcons name="navigation-variant" size={18} color="#fff" />
                  <Text style={styles.navigateBtnText}>Live Navigation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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

          {/* Geofence info strip */}
          <View style={styles.geofenceInfo}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color={Colors.info} />
            <Text style={styles.geofenceInfoText}>
              You must be within 300m of a stop to mark it as complete.
            </Text>
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
                            onPress={() => {
                              if (item.latitude && item.longitude) {
                                openNavigation(item.latitude, item.longitude, item.address);
                              } else {
                                navigation.navigate('LiveNavigation');
                              }
                            }}
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
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <MaterialCommunityIcons name="map-search-outline" size={48} color={Colors.textTertiary} />
                <Text style={{ ...textStyles.body, color: Colors.textTertiary, marginTop: 8 }}>No stops assigned today</Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        </>
      )}

      {/* ─── Complaints Tab ──────────────────────────────────── */}
      {activeTab === TAB_COMPLAINTS && (
        complaintsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ flex: 1, marginTop: 60 }} />
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={c => c._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            renderItem={({ item }) => {
              const hasCoords = item.location?.latitude && item.location?.longitude;
              return (
                <View style={[styles.complaintCard, Shadows.sm]}>
                  {/* Header */}
                  <View style={styles.complaintCardHeader}>
                    <View style={[styles.complaintIconBg, { backgroundColor: '#FFF8E1' }]}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#FF8F00" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.complaintCardTitle} numberOfLines={1}>{item.title || item.category}</Text>
                      <Text style={styles.complaintCardCategory}>{item.category}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: item.status === 'assigned' ? '#FFF8E1' : '#E3F2FD' }]}>
                      <Text style={[styles.statusPillText, { color: item.status === 'assigned' ? '#FF8F00' : Colors.info }]}>
                        {item.status === 'assigned' ? 'Assigned' : 'In Progress'}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {item.description ? (
                    <Text style={styles.complaintDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}

                  {/* Location */}
                  {item.location?.address ? (
                    <View style={styles.complaintLocation}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.primary} />
                      <Text style={styles.complaintLocationText} numberOfLines={2}>{item.location.address}</Text>
                    </View>
                  ) : null}

                  {/* Citizen info */}
                  {item.citizen?.name ? (
                    <View style={styles.citizenRow}>
                      <MaterialCommunityIcons name="account-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.citizenText}>Reported by: {item.citizen.name}</Text>
                      {item.citizen?.phone ? (
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => Linking.openURL(`tel:${item.citizen.phone}`)}
                        >
                          <MaterialCommunityIcons name="phone-outline" size={13} color="#fff" />
                          <Text style={styles.callBtnText}>Call</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Uploaded Images */}
                  {item.images && item.images.length > 0 ? (
                    <View style={styles.imagesSection}>
                      <View style={styles.imagesSectionHeader}>
                        <MaterialCommunityIcons name="image-multiple-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.imagesSectionLabel}>Photo Evidence ({item.images.length})</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                        {item.images.map((img, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setSelectedImage(`${IMG_BASE}${img}`)}
                            activeOpacity={0.85}
                          >
                            <Image
                              source={{ uri: `${IMG_BASE}${img}` }}
                              style={styles.evidenceImage}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <View style={styles.noImageBadge}>
                      <MaterialCommunityIcons name="image-off-outline" size={13} color={Colors.textTertiary} />
                      <Text style={styles.noImageText}>No photo uploaded</Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={styles.complaintActions}>
                    {hasCoords ? (
                      <TouchableOpacity
                        style={[styles.complaintActionBtn, styles.navigateComplaintBtn]}
                        onPress={() => openNavigation(item.location.latitude, item.location.longitude, item.location.address)}
                      >
                        <MaterialCommunityIcons name="navigation-variant" size={15} color="#fff" />
                        <Text style={styles.complaintActionBtnText}>Get Directions</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.complaintActionBtn, styles.resolveComplaintBtn]}
                      onPress={async () => {
                        // Geofence check if complaint coordinates exist
                        const cLat = item.location?.latitude;
                        const cLon = item.location?.longitude;
                        if (cLat && cLon) {
                          let curLoc = driverLocation || location;
                          if (!curLoc) {
                            try {
                              curLoc = await getCurrentLocation();
                              setDriverLocation(curLoc);
                            } catch {
                              Alert.alert('📍 Location Required', 'GPS location is required to verify you are at the complaint location before resolving.');
                              return;
                            }
                          }

                          if (curLoc?.latitude && curLoc?.longitude) {
                            const dist = haversineKm(curLoc.latitude, curLoc.longitude, cLat, cLon);
                            if (dist > COMPLETION_RADIUS_KM) {
                              const distM = Math.round(dist * 1000);
                              Alert.alert(
                                '📍 Too Far Away',
                                `You are ${distM}m away from the complaint location.\n\nYou must be within 300m to mark it as resolved.\n\nPlease navigate to the location first.`,
                                [
                                  { text: 'Get Directions', onPress: () => openNavigation(cLat, cLon, item.location?.address) },
                                  { text: 'Cancel', style: 'cancel' },
                                ]
                              );
                              return;
                            }
                          }
                        }

                        Alert.alert(
                          'Mark as Resolved?',
                          `Have you resolved this complaint at "${item.location?.address || 'the location'}"?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Yes, Resolved ✅',
                              onPress: async () => {
                                try {
                                  await authRequest(`/complaints/${item._id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ status: 'resolved', resolutionNote: 'Resolved by assigned driver.' }),
                                  });
                                  setComplaints(prev => prev.filter(c => c._id !== item._id));
                                  Alert.alert('✅ Done!', 'Complaint marked as resolved.');
                                } catch (e) {
                                  Alert.alert('Error', e.message || 'Could not update complaint.');
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <MaterialCommunityIcons name="check-circle-outline" size={15} color={Colors.primary} />
                      <Text style={[styles.complaintActionBtnText, { color: Colors.primary }]}>Mark Resolved</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyComplaints}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={56} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No Assigned Complaints</Text>
                <Text style={styles.emptySubtitle}>Complaints assigned to you by admin will appear here with navigation directions.</Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        )
      )}

      {/* ─── Image Preview Popup Modal ─────────────────────── */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedImage(null)}
          />
          <View style={styles.imageModalCard}>
            <View style={styles.imageModalHeader}>
              <View style={styles.imageModalTitleRow}>
                <MaterialCommunityIcons name="image-outline" size={18} color={Colors.primary} />
                <Text style={styles.imageModalTitle}>Photo Evidence</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedImage(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalFullImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.modalDismissText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ─── Tabs ──
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.base, marginTop: Spacing.sm, marginBottom: Spacing.sm, gap: Spacing.sm },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnComplaint: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  tabBtnText: { ...textStyles.label, color: Colors.textSecondary },
  tabBtnTextActive: { color: '#fff' },
  tabCount: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountComplaint: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: Colors.textSecondary },

  // ─── Route tab ──
  mapContainer: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm },
  navBtnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  startRouteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#1565C0', borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  startRouteBtnText: { ...textStyles.button, color: '#fff' },
  navigateBtn: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  navigateBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md },
  navigateBtnText: { ...textStyles.button, color: '#fff' },
  progressContainer: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { ...textStyles.label, color: Colors.textSecondary },
  progressValue: { ...textStyles.label, color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  progressBar: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  geofenceInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.base, marginBottom: 6,
    backgroundColor: Colors.infoSurface, borderRadius: BorderRadius.sm, padding: Spacing.sm,
  },
  geofenceInfoText: { ...textStyles.caption, color: Colors.info, flex: 1 },
  listContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  stopCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, overflow: 'hidden' },
  activeStopCard: { borderWidth: 1.5, borderColor: Colors.info + '50', backgroundColor: Colors.infoSurface + '30' },
  stopHeader: { flexDirection: 'row', padding: Spacing.md },
  stopNumberCol: { alignItems: 'center', marginRight: 12, width: 28 },
  stopNumBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
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
  metaText: { ...textStyles.caption, color: Colors.textTertiary },
  complaintBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  complaintBadgeText: { ...textStyles.caption, color: Colors.danger },
  expandedActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.sm },
  primaryAction: { backgroundColor: Colors.primary },
  secondaryAction: { backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: Colors.primary + '40' },
  actionBtnText: { ...textStyles.label, color: '#fff' },

  // ─── Complaints tab ──
  complaintCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md, padding: Spacing.base,
  },
  complaintCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  complaintIconBg: { width: 44, height: 44, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  complaintCardTitle: { ...textStyles.labelLarge, color: Colors.textPrimary },
  complaintCardCategory: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillText: { ...textStyles.caption, fontFamily: 'Poppins_600SemiBold' },
  complaintDesc: { ...textStyles.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  complaintLocation: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: Spacing.sm },
  complaintLocationText: { ...textStyles.caption, color: Colors.textSecondary, flex: 1 },
  citizenRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.sm },
  citizenText: { ...textStyles.caption, color: Colors.textSecondary, flex: 1 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.success, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  callBtnText: { ...textStyles.caption, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  complaintActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  complaintActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  navigateComplaintBtn: { backgroundColor: Colors.primary },
  resolveComplaintBtn: { backgroundColor: Colors.primarySurface, borderWidth: 1.5, borderColor: Colors.primary + '50' },
  complaintActionBtnText: { ...textStyles.label, color: '#fff' },

  // ─── Image evidence ──
  imagesSection: { marginBottom: Spacing.sm },
  imagesSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  imagesSectionLabel: { ...textStyles.caption, color: Colors.textSecondary, fontFamily: 'Poppins_600SemiBold' },
  imageScroll: { flexDirection: 'row' },
  evidenceImage: { width: 100, height: 72, borderRadius: BorderRadius.md, marginRight: 8, borderWidth: 1.5, borderColor: Colors.border },
  noImageBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 6, marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  noImageText: { ...textStyles.caption, color: Colors.textTertiary },

  emptyComplaints: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...textStyles.h6, color: Colors.textSecondary, marginTop: 16, textAlign: 'center' },
  emptySubtitle: { ...textStyles.body, color: Colors.textTertiary, marginTop: 8, textAlign: 'center', lineHeight: 22 },

  // ─── Image Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  imageModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.xl,
  },
  imageModalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  imageModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageModalTitle: {
    ...textStyles.labelLarge,
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFullImage: {
    width: '100%',
    height: 340,
    borderRadius: BorderRadius.md,
    backgroundColor: '#000',
  },
  modalDismissBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primarySurface,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
  },
  modalDismissText: {
    ...textStyles.label,
    color: Colors.primary,
  },
});

export default AssignedRoutes;
