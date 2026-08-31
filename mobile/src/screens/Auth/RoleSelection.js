import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

const ROLES = [
  {
    id: 'citizen',
    title: 'Citizen',
    subtitle: 'Report complaints & track garbage collection in your area',
    icon: 'account-group-outline',
    gradient: ['#2E7D32', '#4CAF50'],
    features: ['Report Complaints', 'Live Truck Tracking', 'Collection Schedule', 'Notifications'],
    accent: '#FFC107',
  },
  {
    id: 'driver',
    title: 'Driver',
    subtitle: 'Manage your assigned route & update collection status',
    icon: 'truck-outline',
    gradient: ['#1565C0', '#1976D2'],
    features: ['View Assigned Route', 'Navigation Support', 'Update Collections', 'Report Status'],
    accent: '#90CAF9',
  },
];

const RoleCard = ({ role, index, onSelect, fadeAnim, slideAnim }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        marginBottom: Spacing.base,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onSelect(role.id)}
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
        }
      >
        <LinearGradient colors={role.gradient} style={styles.roleCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* BG circle */}
          <View style={styles.roleCircle} />

          <View style={styles.roleHeader}>
            <View style={[styles.roleIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialCommunityIcons name={role.icon} size={32} color="#fff" />
            </View>
            <View style={styles.roleTitleBlock}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            {role.features.map(f => (
              <View key={f} style={styles.featureChip}>
                <MaterialCommunityIcons name="check-circle" size={11} color={role.accent} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.selectRow}>
            <Text style={styles.selectText}>Continue as {role.title}</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RoleSelection = ({ navigation }) => {
  const fadeAnims = ROLES.map(() => useRef(new Animated.Value(0)).current);
  const slideAnims = ROLES.map(() => useRef(new Animated.Value(40)).current);
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 50, useNativeDriver: true }),
      ]),
      ...ROLES.map((_, i) =>
        Animated.parallel([
          Animated.timing(fadeAnims[i], { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(slideAnims[i], { toValue: 0, tension: 50, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  const handleSelect = (roleId) => {
    navigation.navigate('Login', { role: roleId });
  };

  return (
    <LinearGradient colors={['#F5F7FA', '#E8F5E9']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <View style={styles.logoBg}>
            <MaterialCommunityIcons name="recycle" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>CleanConnect+</Text>
          <Text style={styles.heading}>Choose Your Role</Text>
          <Text style={styles.subheading}>Select how you will be using the app</Text>
        </Animated.View>

        {/* Role Cards */}
        {ROLES.map((role, i) => (
          <RoleCard
            key={role.id}
            role={role}
            index={i}
            onSelect={handleSelect}
            fadeAnim={fadeAnims[i]}
            slideAnim={slideAnims[i]}
          />
        ))}

        <Text style={styles.footer}>
          Municipal Corporation of Coimbatore © 2026
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.base, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logoBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  appName: {
    ...textStyles.labelLarge,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  heading: { ...textStyles.h3, color: Colors.textPrimary, textAlign: 'center' },
  subheading: {
    ...textStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  roleCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  roleCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -40,
  },
  roleHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  roleIconBg: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  roleTitleBlock: { flex: 1 },
  roleTitle: { ...textStyles.h5, color: '#fff', marginBottom: 4 },
  roleSubtitle: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  featureText: { ...textStyles.caption, color: 'rgba(255,255,255,0.9)' },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: Spacing.sm,
  },
  selectText: {
    ...textStyles.label,
    color: '#fff',
    marginRight: 6,
    fontFamily: 'Poppins_600SemiBold',
  },
  footer: {
    ...textStyles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.base,
  },
});

export default RoleSelection;
