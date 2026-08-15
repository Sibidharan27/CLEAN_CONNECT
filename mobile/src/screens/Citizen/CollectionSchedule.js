import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import StatusBadge from '../../components/Card/StatusBadge';
import { getUpcomingCollections } from '../../services/scheduleService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CollectionSchedule = ({ navigation }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState([]);
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

  // Days that have collections (based on dayOfWeek from API)
  const todaySchedule = schedules.find(s => s.isToday);
  const upcoming = schedules.filter(s => !s.isToday);

  return (
    <View style={styles.container}>
      <Header title="Collection Schedule" subtitle="Your area's collection times" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
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
                <Text style={styles.sectionTitle}>Today's Collection</Text>
                <LinearGradient colors={Colors.gradientPrimary} style={[styles.todayCard, Shadows.primary]}>
                  <View style={styles.todayCardCircle} />
                  <View style={styles.todayLeft}>
                    <View style={styles.todayIconBg}>
                      <MaterialCommunityIcons name={todaySchedule.icon || 'trash-can'} size={24} color={Colors.primary} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.todayType}>{todaySchedule.type}</Text>
                      <Text style={styles.todayTime}>{todaySchedule.timeSlot}</Text>
                      {todaySchedule.driver && <Text style={styles.todayDriver}>Driver: {todaySchedule.driver.name || 'Assigned'}</Text>}
                    </View>
                  </View>
                  <StatusBadge status="Today" size="small" />
                </LinearGradient>
              </>
            )}

            {/* Upcoming */}
            <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
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
                    <Text style={styles.scheduleDay}>{s.nextDay}</Text>
                    <Text style={styles.scheduleDate}>{s.nextDate} • {s.daysUntil === 1 ? 'Tomorrow' : `In ${s.daysUntil} days`}</Text>
                    <Text style={styles.scheduleTime}>{s.timeSlot}</Text>
                  </View>
                  <View style={styles.scheduleRight}>
                    <Text style={styles.scheduleType}>{s.type}</Text>
                    <StatusBadge status="Upcoming" size="small" />
                  </View>
                </View>
              ))
            )}

            {/* Collection Types */}
            <Text style={styles.sectionTitle}>Collection Types</Text>
            <View style={styles.typesGrid}>
              {[
                { type: 'General Waste', icon: 'trash-can', color: Colors.primary, days: 'Mon, Thu' },
                { type: 'Recyclables', icon: 'recycle', color: Colors.info, days: 'Wednesday' },
                { type: 'Organic Waste', icon: 'leaf', color: Colors.success, days: 'Saturday' },
                { type: 'Hazardous', icon: 'biohazard', color: Colors.danger, days: 'On Request' },
              ].map(t => (
                <View key={t.type} style={[styles.typeCard, Shadows.sm]}>
                  <View style={[styles.typeIconBg, { backgroundColor: t.color + '15' }]}>
                    <MaterialCommunityIcons name={t.icon} size={20} color={t.color} />
                  </View>
                  <Text style={styles.typeName}>{t.type}</Text>
                  <Text style={styles.typeDays}>{t.days}</Text>
                </View>
              ))}
            </View>
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
  calendarCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.xl },
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
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.md },
  todayCard: { borderRadius: BorderRadius.lg, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl, overflow: 'hidden' },
  todayCardCircle: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', right: -20, top: -20 },
  todayLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  todayIconBg: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  todayType: { ...textStyles.h6, color: '#fff' },
  todayTime: { ...textStyles.bodySmall, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  todayDriver: { ...textStyles.caption, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scheduleCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  scheduleIconBg: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  scheduleInfo: { flex: 1, marginLeft: 12 },
  scheduleDay: { ...textStyles.labelLarge, color: Colors.textPrimary },
  scheduleDate: { ...textStyles.bodySmall, color: Colors.textSecondary },
  scheduleTime: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 2 },
  scheduleRight: { alignItems: 'flex-end', gap: 6 },
  scheduleType: { ...textStyles.caption, color: Colors.textSecondary },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, width: '47%', alignItems: 'center' },
  typeIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  typeName: { ...textStyles.label, color: Colors.textPrimary, textAlign: 'center' },
  typeDays: { ...textStyles.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { ...textStyles.body, color: Colors.textTertiary, marginTop: 8 },
});

export default CollectionSchedule;
