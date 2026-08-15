import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import ComplaintCard from '../../components/ComplaintCard/ComplaintCard';
import StatusBadge from '../../components/Card/StatusBadge';
import { getComplaints } from '../../services/complaintService';

const STATUS_FILTERS = ['All', 'open', 'in_progress', 'resolved', 'closed'];
const STATUS_LABELS = { all: 'All', open: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

const mapStatus = (s) => {
  if (s === 'in_progress') return 'In Progress';
  if (s === 'open') return 'Pending';
  if (s === 'resolved') return 'Completed';
  return s;
};

const ComplaintHistory = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadComplaints = useCallback(async () => {
    try {
      const data = await getComplaints();
      setComplaints(data);
      setFiltered(data);
    } catch (e) {
      console.warn('ComplaintHistory error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadComplaints(); }, []);

  const applyFilter = (filter) => {
    setActiveFilter(filter);
    if (filter === 'All') setFiltered(complaints);
    else setFiltered(complaints.filter(c => c.status === filter));
  };

  const onRefresh = () => { setRefreshing(true); loadComplaints(); };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={60} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Complaints Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'All' ? 'You haven\'t reported any issues yet.' : `No ${STATUS_LABELS[activeFilter] || activeFilter} complaints.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="My Complaints" subtitle={`${filtered.length} complaint${filtered.length !== 1 ? 's' : ''}`} showBack onBack={() => navigation.goBack()} />

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={i => i}
          contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => applyFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {STATUS_LABELS[item.toLowerCase()] || item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          renderItem={({ item }) => (
            <ComplaintCard
              complaint={{
                ...item,
                id: item._id,
                status: mapStatus(item.status),
                date: item.createdAt?.split('T')[0] || '',
                time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
                location: item.location?.address || 'Location not specified',
              }}
              onPress={() => navigation.navigate('ComplaintDetails', { complaint: item })}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterBar: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceVariant, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...textStyles.label, color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  listContent: { padding: Spacing.base, paddingBottom: 80 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { ...textStyles.h5, color: Colors.textPrimary, marginTop: Spacing.base },
  emptySubtitle: { ...textStyles.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.xl },
});

export default ComplaintHistory;
