import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import StatusBadge from '../../components/Card/StatusBadge';
import { getUpcomingCollections } from '../../services/scheduleService';
import { useAuth } from '../../context/AuthContext';
import { PEELAMEDU_ZONES, getZoneForStreet } from '../../constants/zonesData';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CollectionSchedule = ({ navigation }) => {
  const { user } = useAuth();
  const citizenZone = getZoneForStreet(user?.street || user?.zone);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState([]);
  const [selectedZoneTab, setSelectedZoneTab] = useState(citizenZone.id);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), currentMonth, 1).getDay();

  const loadSchedules = useCallback(async () => {
    try {
      const data = await getUpcomingCollections();
      setSchedules(data);
    } catch (e) {
      console.warn('Schedule load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadSchedules(); }, []);

  const onRefresh = () => { setRefreshing(true); loadSchedules(); };

  const todaySchedule = schedules.find(s => s.isToday);
  const upcoming = schedules.filter(s => !s.isToday);

  const currentZoneData = PEELAMEDU_ZONES.find(z => z.id === selectedZoneTab) || citizenZone;

  return (
    <View style={styles.container}>
      <Header
        title="Collection Schedule"
        subtitle={`Peelamedu • ${citizenZone.shortName}`}
        showBack
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Your Location & Zone Summary */}
        <View style={[styles.citizenZoneCard, Shadows.sm]}>
          <View style={styles.zoneCardTop}>
            <MaterialCommunityIcons name="home-city" size={24} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.czLabel}>YOUR COLLECTION ZONE</Text>
              <Text style={styles.czTitle}>{citizenZone.name}</Text>
              <Text style={styles.czStreet}>
                {user?.street ? `Street: ${user.street}` : 'Peelamedu Main Area'}
              </Text>
            </View>
            <View style={styles.vehiclePill}>
              <Text style={styles.vehiclePillText}>{citizenZone.vehicleId}</Text>
            </View>
          </View>
          <View style={styles.czMetaRow}>
            <View style={styles.czMetaItem}>
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.textSecondary} />
              <Text style={styles.czMetaText}>{citizenZone.scheduleDay}</Text>
            </View>
            <View style={styles.czMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.czMetaText}>{citizenZone.timeSlot}</Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={[styles.calendarCard, Shadows.md]}>
          <View style={styles.calendarHeader}>
            <View style={styles.navBtn} />
            <Text style={styles.monthYear}>{MONTHS[currentMonth]} {today.getFullYear()}</Text>
            <View style={styles.navBtn} />
          </View>
          <View style={styles.dayNamesRow}>
            {DAYS.map(d => <Text key={d} style={styles.dayName}>{d}</Text>)}
          </View>
          <View style={styles.calendarGrid}>
            {Array.from({ length: firstDay }).map((_, i) => <View key={`e${i}`} style={styles.calendarCell} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday = day === today.getDate();
              const isSelected = day === selectedDate;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.calendarCell, isSelected && styles.selectedCell, isToday && !isSelected && styles.todayCell]}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={[styles.dayNum, isSelected && styles.selectedDayNum, isToday && !isSelected && styles.todayDayNum]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <>
            {/* Today's collection */}
            {todaySchedule && (
              <>
                <Text style={styles.sectionTitle}>Today&apos;s Collection in Your Area</Text>
                <LinearGradient colors={Colors.gradientPrimary} style={[styles.todayCard, Shadows.primary]}>
                  <View style={styles.todayCardCircle} />
                  <View style={styles.todayLeft}>
                    <View style={styles.todayIconBg}>
                      <MaterialCommunityIcons name={todaySchedule.icon || 'trash-can'} size={24} color={Colors.primary} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.todayType}>{todaySchedule.zone}</Text>
                      <Text style={styles.todayTime}>{todaySchedule.type} • {todaySchedule.timeSlot}</Text>
                      {todaySchedule.vehicleId && (
                        <Text style={styles.todayDriver}>Assigned Vehicle: {todaySchedule.vehicleId}</Text>
                      )}
                    </View>
                  </View>
                  <StatusBadge status="Today" size="small" />
                </LinearGradient>
              </>
            )}

            {/* Zone Selector Tabs */}
            <Text style={styles.sectionTitle}>Peelamedu Zone Schedules</Text>
            <View style={styles.zoneTabsRow}>
              {PEELAMEDU_ZONES.map(z => (
                <TouchableOpacity
                  key={z.id}
                  style={[styles.zoneTabBtn, selectedZoneTab === z.id && styles.zoneTabBtnActive]}
                  onPress={() => setSelectedZoneTab(z.id)}
                >
                  <Text style={[styles.zoneTabBtnText, selectedZoneTab === z.id && styles.zoneTabBtnTextActive]}>
                    {z.shortName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Zone Streets & Schedule */}
            <View style={[styles.zoneDetailCard, Shadows.sm]}>
              <View style={styles.zoneDetailHeader}>
                <View style={[styles.zoneIconCircle, { backgroundColor: currentZoneData.color + '20' }]}>
                  <MaterialCommunityIcons name={currentZoneData.icon} size={22} color={currentZoneData.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.zoneDetailTitle}>{currentZoneData.name}</Text>
                  <Text style={styles.zoneDetailTiming}>
                    🗓️ {currentZoneData.scheduleDay} • ⏰ {currentZoneData.timeSlot}
                  </Text>
                </View>
              </View>

              <Text style={styles.streetsListTitle}>Streets Covered in this Zone ({currentZoneData.streets.length}):</Text>
              {currentZoneData.streets.map((st, i) => (
                <View key={st.name} style={styles.streetItem}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={currentZoneData.color} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.streetNameText}>{st.name}</Text>
                    <Text style={styles.streetLandmarkText}>{st.landmark} ({st.housesCount} homes)</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Upcoming collections */}
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Upcoming Zone Rotations</Text>
            {upcoming.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No upcoming collections found</Text>
              </View>
            ) : (
              upcoming.map(s => (
                <View key={s._id} style={[styles.scheduleCard, Shadows.sm]}>
                  <View style={[styles.scheduleIconBg, { backgroundColor: (s.color || Colors.primary) + '15' }]}>
                    <MaterialCommunityIcons name={s.icon || 'trash-can'} size={22} color={s.color || Colors.primary} />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleDay}>{s.zone}</Text>
                    <Text style={styles.scheduleDate}>{s.nextDay}, {s.nextDate} • {s.daysUntil === 1 ? 'Tomorrow' : `In ${s.daysUntil} days`}</Text>
                    <Text style={styles.scheduleTime}>{s.timeSlot} • Vehicle: {s.vehicleId || 'GCT'}</Text>
                  </View>
                  <View style={styles.scheduleRight}>
                    <Text style={styles.scheduleType}>{s.type}</Text>
                    <StatusBadge status="Upcoming" size="small" />
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base },

  citizenZoneCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    padding: Spacing.base, marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
  },
  zoneCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  czLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  czTitle: { ...textStyles.labelLarge, color: Colors.textPrimary },
  czStreet: { ...textStyles.caption, color: Colors.textSecondary },
  vehiclePill: { backgroundColor: Colors.primarySurface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  vehiclePillText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.primary },
  czMetaRow: { flexDirection: 'row', gap: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.sm },
  czMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  czMetaText: { ...textStyles.caption, color: Colors.textSecondary, fontFamily: 'Poppins_500Medium' },

  calendarCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.base },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  navBtn: { width: 36, height: 36 },
  monthYear: { ...textStyles.h6, color: Colors.textPrimary },
  dayNamesRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  dayName: { ...textStyles.caption, color: Colors.textTertiary, width: 36, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  selectedCell: { backgroundColor: Colors.primary, borderRadius: 20 },
  todayCell: { backgroundColor: Colors.primarySurface, borderRadius: 20 },
  dayNum: { ...textStyles.body, color: Colors.textPrimary },
  selectedDayNum: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  todayDayNum: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  legend: { flexDirection: 'row', gap: Spacing.base, justifyContent: 'center', marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...textStyles.caption, color: Colors.textSecondary },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.sm },
  todayCard: { borderRadius: BorderRadius.lg, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.base, overflow: 'hidden' },
  todayCardCircle: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', right: -20, top: -20 },
  todayLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  todayIconBg: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  todayType: { ...textStyles.h6, color: '#fff' },
  todayTime: { ...textStyles.bodySmall, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  todayDriver: { ...textStyles.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  zoneTabsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  zoneTabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  zoneTabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  zoneTabBtnText: { ...textStyles.caption, color: Colors.textSecondary, fontFamily: 'Poppins_600SemiBold' },
  zoneTabBtnTextActive: { color: '#fff' },

  zoneDetailCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base },
  zoneDetailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  zoneIconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  zoneDetailTitle: { ...textStyles.labelLarge, color: Colors.textPrimary },
  zoneDetailTiming: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 2 },
  streetsListTitle: { ...textStyles.labelSmall, color: Colors.textTertiary, marginTop: Spacing.xs, marginBottom: Spacing.xs },
  streetItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5 },
  streetNameText: { ...textStyles.bodySmall, color: Colors.textPrimary, fontFamily: 'Poppins_500Medium' },
  streetLandmarkText: { ...textStyles.caption, color: Colors.textSecondary, fontSize: 11 },

  scheduleCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  scheduleIconBg: { width: 44, height: 44, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  scheduleInfo: { flex: 1, marginLeft: 12 },
  scheduleDay: { ...textStyles.labelLarge, color: Colors.textPrimary },
  scheduleDate: { ...textStyles.bodySmall, color: Colors.textSecondary },
  scheduleTime: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 2 },
  scheduleRight: { alignItems: 'flex-end', gap: 6 },
  scheduleType: { ...textStyles.caption, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { ...textStyles.body, color: Colors.textTertiary, marginTop: 8 },
});

export default CollectionSchedule;
