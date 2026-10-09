import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import Header from '../../components/Header/Header';
import InputField from '../../components/Input/InputField';
import Dropdown from '../../components/Input/Dropdown';
import PrimaryButton from '../../components/Button/PrimaryButton';
import SecondaryButton from '../../components/Button/SecondaryButton';
import { CATEGORIES } from '../../constants/data';
import { useLocation } from '../../context/LocationContext';
import { createComplaint } from '../../services/complaintService';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { PEELAMEDU_ZONES, ALL_PEELAMEDU_STREETS, getZoneForStreet } from '../../constants/zonesData';

const ReportComplaint = ({ navigation }) => {
  const { user } = useAuth();
  const { getCurrentLocation, isLocating } = useLocation();
  const { refreshUnreadCount } = useNotifications();

  const defaultZone = getZoneForStreet(user?.street || user?.zone);

  const [form, setForm] = useState({
    description: '',
    category: '',
    street: user?.street || defaultZone.streets[0].name,
    zone: defaultZone.name,
    area: 'Peelamedu',
    address: user?.address || `${defaultZone.streets[0].name}, Peelamedu`,
    latitude: defaultZone.streets[0].latitude,
    longitude: defaultZone.streets[0].longitude,
    imageUri: null,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');

  const successAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Handle Street change and update Zone automatically
  const handleStreetSelect = (streetName) => {
    const matched = ALL_PEELAMEDU_STREETS.find(s => s.name === streetName);
    if (matched) {
      setForm(prev => ({
        ...prev,
        street: matched.name,
        zone: matched.zoneName,
        address: `${matched.name}, Peelamedu`,
        latitude: matched.latitude,
        longitude: matched.longitude,
      }));
    } else {
      update('street', streetName);
    }
  };

  // Real GPS using LocationContext
  const handleGPS = async () => {
    try {
      const loc = await getCurrentLocation();
      update('address', loc.address || 'Peelamedu Location');
      update('latitude', loc.latitude);
      update('longitude', loc.longitude);
      if (loc.address) {
        const detectedZone = getZoneForStreet(loc.address);
        update('zone', detectedZone.name);
      }
    } catch (e) {
      Alert.alert('Location Error', e.message || 'Unable to get location. Please enter manually.');
    }
  };

  // Image picker
  const handlePickImage = () => {
    Alert.alert('Upload Photo', 'Choose a source', [
      {
        text: 'Camera', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false });
          if (!result.canceled) update('imageUri', result.assets[0].uri);
        }
      },
      {
        text: 'Gallery', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission required', 'Gallery access is needed.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
          if (!result.canceled) update('imageUri', result.assets[0].uri);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 10) errs.description = 'Please provide more details (min 10 chars)';
    if (!form.category) errs.category = 'Please select a category';
    if (!form.street) errs.street = 'Please select your street in Peelamedu';
    if (!form.address.trim()) errs.address = 'Location address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setApiError('');
    try {
      const result = await createComplaint({
        category: form.category,
        description: form.description,
        area: 'Peelamedu',
        zone: form.zone,
        street: form.street,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        imageUri: form.imageUri,
      });
      setComplaintId(result._id?.slice(-6).toUpperCase() || 'NEW');
      setSubmitted(true);
      await refreshUnreadCount();
      Animated.spring(successAnim, { toValue: 1, tension: 60, useNativeDriver: true }).start();
    } catch (e) {
      setApiError(e.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const streetOptions = ALL_PEELAMEDU_STREETS.map(s => ({
    label: `${s.name} (${s.zoneName.replace('Peelamedu – ', '')})`,
    value: s.name,
  }));

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={Colors.gradientLight} style={styles.successBg} />
        <Animated.View style={[styles.successCard, Shadows.xl, { transform: [{ scale: successAnim }], opacity: successAnim }]}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.successIconBg}>
            <MaterialCommunityIcons name="check" size={44} color="#fff" />
          </LinearGradient>
          <Text style={styles.successTitle}>Complaint Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Registered for {form.street}, {form.zone}. Assigned collection vehicle will resolve it promptly.
          </Text>
          <View style={styles.successIdBox}>
            <Text style={styles.successIdLabel}>Complaint ID</Text>
            <Text style={styles.successId}>CC-{complaintId}</Text>
          </View>
          <PrimaryButton title="Track My Complaint" onPress={() => navigation.navigate('ComplaintHistory')} style={{ marginBottom: Spacing.sm }} />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.goHomeText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Header title="Report Complaint" subtitle="Peelamedu Waste Reporting" showBack onBack={() => navigation.goBack()} />
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Image Upload */}
          <TouchableOpacity style={styles.imageUpload} onPress={handlePickImage} activeOpacity={0.8}>
            {form.imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: form.imageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage}>
                  <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                  <Text style={styles.changePhotoText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.cameraIconBg}>
                  <MaterialCommunityIcons name="camera-outline" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.imagePlaceholderTitle}>Add Photo Evidence</Text>
                <Text style={styles.imagePlaceholderSub}>Tap to upload from camera or gallery</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Dropdown
              label="Issue Category"
              value={form.category}
              options={CATEGORIES}
              onSelect={v => update('category', v)}
              placeholder="Select issue category"
              error={errors.category}
            />

            {/* Peelamedu Street Selector */}
            <Dropdown
              label="Street in Peelamedu"
              value={form.street}
              options={streetOptions}
              onSelect={handleStreetSelect}
              placeholder="Select your street"
              error={errors.street}
            />

            {/* Zone Tag Display */}
            <View style={styles.zoneTagBox}>
              <MaterialCommunityIcons name="map-marker-radius" size={16} color={Colors.primary} />
              <Text style={styles.zoneTagText}>Mapped Zone: <Text style={{ fontWeight: '700', color: Colors.primary }}>{form.zone}</Text></Text>
            </View>

            <InputField
              label="Description"
              value={form.description}
              onChangeText={v => update('description', v)}
              placeholder="Describe the issue in detail (e.g. bin overflowing, missed collection)..."
              multiline
              numberOfLines={4}
              icon="text-long"
              error={errors.description}
              autoCapitalize="sentences"
            />

            {/* Specific Address / Landmark */}
            <Text style={styles.locationLabel}>Exact Location / Landmark</Text>
            <View style={[styles.locationCard, errors.address && styles.errorBorder]}>
              <View style={styles.locationTop}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.primary} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {form.address || 'Select street above or use GPS'}
                </Text>
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity style={[styles.gpsBtn, Shadows.sm]} onPress={handleGPS} disabled={isLocating}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name={isLocating ? 'loading' : 'crosshairs-gps'} size={16} color={Colors.primary} />
                    <Text style={styles.gpsBtnText}>{isLocating ? 'Locating...' : 'Use GPS'}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.orDivider}><Text style={styles.orText}>or</Text></View>
                <InputField
                  value={form.address}
                  onChangeText={v => update('address', v)}
                  placeholder="Type address / landmark"
                  containerStyle={{ marginBottom: 0, flex: 1 }}
                  style={{ minHeight: 44 }}
                />
              </View>
            </View>
            {errors.address && (
              <Text style={styles.errorText}>
                <MaterialCommunityIcons name="alert-circle-outline" size={12} color={Colors.danger} /> {errors.address}
              </Text>
            )}
          </View>

          {apiError ? (
            <View style={styles.apiErrorBox}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>📋 Submission Guidelines</Text>
            {['Select accurate street within Peelamedu for assigned vehicle dispatch', 'Upload clear photos for supervisor assessment', 'Be specific with landmarks', 'One complaint per issue'].map((g, i) => (
              <View key={i} style={styles.guidelineItem}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.primary} />
                <Text style={styles.guidelineText}>{g}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            title="Submit Complaint"
            onPress={handleSubmit}
            loading={isLoading}
            icon={<MaterialCommunityIcons name="send" size={18} color="#fff" />}
            style={{ marginBottom: Spacing.sm }}
          />
          <SecondaryButton title="Cancel" onPress={() => navigation.goBack()} />
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base },
  imageUpload: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.base, ...Shadows.sm },
  imagePlaceholder: { height: 150, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primaryLight, borderStyle: 'dashed', borderRadius: BorderRadius.lg },
  cameraIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  imagePlaceholderTitle: { ...textStyles.labelLarge, color: Colors.primary },
  imagePlaceholderSub: { ...textStyles.caption, color: Colors.textSecondary, marginTop: 4 },
  imagePreviewContainer: { height: 180, position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  changePhotoBtn: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  changePhotoText: { ...textStyles.label, color: '#fff' },
  formCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
  zoneTagBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '25',
  },
  zoneTagText: { ...textStyles.caption, color: Colors.primary, fontFamily: 'Poppins_500Medium' },
  locationLabel: { ...textStyles.label, color: Colors.textSecondary, marginBottom: 6 },
  locationCard: { backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.inputBorder, padding: Spacing.md, marginBottom: 4 },
  errorBorder: { borderColor: Colors.danger },
  locationTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: Spacing.sm },
  locationText: { ...textStyles.body, color: Colors.textPrimary, flex: 1 },
  locationActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsBtn: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 10 },
  gpsBtnText: { ...textStyles.label, color: Colors.primary },
  orDivider: { paddingHorizontal: 4 },
  orText: { ...textStyles.caption, color: Colors.textTertiary },
  errorText: { ...textStyles.caption, color: Colors.danger, marginBottom: Spacing.sm },
  apiErrorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerSurface, borderRadius: BorderRadius.sm, padding: Spacing.sm, gap: 8, marginBottom: Spacing.base },
  apiErrorText: { ...textStyles.caption, color: Colors.danger, flex: 1 },
  guidelines: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.base },
  guidelinesTitle: { ...textStyles.label, color: Colors.primary, marginBottom: Spacing.sm },
  guidelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  guidelineText: { ...textStyles.bodySmall, color: Colors.textSecondary, flex: 1 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.base },
  successBg: { ...StyleSheet.absoluteFillObject },
  successCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], alignItems: 'center', width: '100%' },
  successIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  successTitle: { ...textStyles.h3, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  successSubtitle: { ...textStyles.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  successIdBox: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.xl, width: '100%' },
  successIdLabel: { ...textStyles.caption, color: Colors.textTertiary },
  successId: { ...textStyles.h5, color: Colors.primary, marginTop: 4 },
  goHomeText: { ...textStyles.label, color: Colors.textSecondary },
});

export default ReportComplaint;
