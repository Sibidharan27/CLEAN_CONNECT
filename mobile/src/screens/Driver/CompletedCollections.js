import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import InputField from '../../components/Input/InputField';
import PrimaryButton from '../../components/Button/PrimaryButton';
import StatusBadge from '../../components/Card/StatusBadge';
import { COMPLAINTS } from '../../constants/data';

const CompletedCollections = ({ navigation, route }) => {
  const complaint = route?.params?.complaint || COMPLAINTS[0];
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
          <PrimaryButton title="Next Stop" onPress={() => navigation.navigate('LiveNavigation')} style={{ marginBottom: Spacing.sm }} />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back to Route</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Header title="Update Collection" subtitle="Mark stop as completed" showBack onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Complaint Summary */}
          <View style={[styles.complaintCard, Shadows.md]}>
            <View style={styles.complaintHeader}>
              <View style={styles.complaintIconBg}>
                <MaterialCommunityIcons
                  name={complaint.categoryIcon || 'alert-circle-outline'}
                  size={22}
                  color={Colors.primary}
                />
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

          {/* Photo Section */}
          <Text style={styles.sectionTitle}>Capture Collection Photo *</Text>
          <TouchableOpacity
            style={[styles.photoBtn, hasPhoto && styles.photoBtnSuccess, Shadows.sm]}
            onPress={handlePhotoCapture}
            activeOpacity={0.8}
          >
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

          {/* Checklist */}
          <Text style={styles.sectionTitle}>Collection Checklist</Text>
          <View style={[styles.checklistCard, Shadows.sm]}>
            {[
              'All bins emptied from location',
              'Area cleaned after collection',
              'No waste left behind',
              'Bin lids properly closed',
            ].map((item, i) => (
              <View key={i} style={[styles.checkItem, i > 0 && styles.checkItemBorder]}>
                <MaterialCommunityIcons name="checkbox-marked-circle" size={20} color={Colors.success} />
                <Text style={styles.checkItemText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Remarks */}
          <Text style={styles.sectionTitle}>Remarks (Optional)</Text>
          <InputField
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Add any additional notes about this collection..."
            multiline
            numberOfLines={3}
            icon="note-text-outline"
            autoCapitalize="sentences"
          />

          {/* Collection Type */}
          <View style={[styles.typeCard, Shadows.sm]}>
            <Text style={styles.typeLabel}>Waste Collected</Text>
            <View style={styles.typeOptions}>
              {['General', 'Recyclable', 'Organic', 'Mixed'].map(t => (
                <TouchableOpacity key={t} style={[styles.typeChip, t === 'General' && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, t === 'General' && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <PrimaryButton
            title="Mark Collection Complete"
            onPress={handleMarkComplete}
            loading={isLoading}
            icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />}
            style={{ marginTop: Spacing.sm }}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base },
  complaintCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.xl,
  },
  complaintHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  complaintIconBg: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  complaintInfo: { flex: 1 },
  complaintTitle: { ...textStyles.labelLarge, color: Colors.textPrimary },
  complaintId: { ...textStyles.caption, color: Colors.textTertiary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  locationText: { ...textStyles.bodySmall, color: Colors.textSecondary, flex: 1 },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.sm },
  photoBtn: {
    borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.xl,
    borderWidth: 2, borderColor: Colors.primaryLight, borderStyle: 'dashed',
  },
  photoBtnSuccess: { borderStyle: 'solid', borderColor: 'transparent' },
  photoBtnContent: {
    height: 140, alignItems: 'center', justifyContent: 'center', padding: Spacing.base,
  },
  cameraIconBg: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  photoPromptText: { ...textStyles.labelLarge, color: Colors.primary },
  photoPromptSub: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 4 },
  photoSuccessText: { ...textStyles.h6, color: '#fff', marginTop: 8 },
  photoRetakeText: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  checklistCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.xl,
  },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: Spacing.sm },
  checkItemBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  checkItemText: { ...textStyles.body, color: Colors.textPrimary },
  typeCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm,
  },
  typeLabel: { ...textStyles.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  typeOptions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { ...textStyles.label, color: Colors.textSecondary },
  typeChipTextActive: { color: '#fff' },
  successContainer: { flex: 1 },
  successBg: { ...StyleSheet.absoluteFillObject },
  successCard: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    margin: Spacing.base, padding: Spacing['2xl'],
    backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'],
  },
  successIconBg: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primarySurface, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl,
  },
  successTitle: { ...textStyles.h3, color: Colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  successSubtitle: { ...textStyles.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  successMeta: { marginBottom: Spacing.xl },
  successMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  successMetaText: { ...textStyles.body, color: Colors.textSecondary },
  backText: { ...textStyles.label, color: Colors.textSecondary },
});

export default CompletedCollections;
