import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';
import InputField from '../../components/Input/InputField';
import PrimaryButton from '../../components/Button/PrimaryButton';
import Dropdown from '../../components/Input/Dropdown';
import { useAuth } from '../../context/AuthContext';

const AREAS = [
  { label: 'Zone A - Central District', value: 'zone_a' },
  { label: 'Zone B - Lake District', value: 'zone_b' },
  { label: 'Zone C - Garden District', value: 'zone_c' },
  { label: 'Zone D - North District', value: 'zone_d' },
  { label: 'Zone E - South District', value: 'zone_e' },
];

const RegisterScreen = ({ navigation, route }) => {
  const { register } = useAuth();
  const roleParam = route?.params?.role || 'citizen';
  const [form, setForm] = useState({ name: '', email: '', phone: '', area: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (form.phone.length < 10) errs.phone = 'Enter a valid phone number';
    if (roleParam === 'citizen' && !form.area) errs.area = 'Please select your area';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setApiError('');
    setIsLoading(true);
    try {
      await register(form.name, form.email, form.password, roleParam);
      // AuthContext sets user → AppNavigator auto-navigates
    } catch (e) {
      setApiError(e.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isCitizen = roleParam === 'citizen';
  const gradientColors = isCitizen ? Colors.gradientDark : ['#0D47A1', '#1565C0'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradientColors} style={styles.headerBg}>
          <View style={styles.headerCircle} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join CleanConnect+ as a {isCitizen ? 'Citizen' : 'Driver'}</Text>

          {/* Steps indicator */}
          <View style={styles.stepsRow}>
            {['Personal', 'Location', 'Security'].map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepCircle, i === 0 && styles.stepActive]}>
                  <Text style={[styles.stepNum, i === 0 && styles.stepNumActive]}>{i + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>{s}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <Animated.View
          style={[styles.formCard, Shadows.lg, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InputField label="Full Name" value={form.name} onChangeText={v => update('name', v)}
            placeholder="Enter your full name" icon="account-outline" error={errors.name} autoCapitalize="words" />
          <InputField label="Email Address" value={form.email} onChangeText={v => update('email', v)}
            placeholder="Enter your email" icon="email-outline" error={errors.email} keyboardType="email-address" />
          <InputField label="Phone Number" value={form.phone} onChangeText={v => update('phone', v)}
            placeholder="+91 XXXXX XXXXX" icon="phone-outline" error={errors.phone} keyboardType="phone-pad" />

          {isCitizen && (
            <Dropdown label="Select Your Area" value={form.area} options={AREAS}
              onSelect={v => update('area', v)} placeholder="Choose your locality" error={errors.area} />
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Set Password</Text>

          <InputField label="Password" value={form.password} onChangeText={v => update('password', v)}
            placeholder="Minimum 8 characters" icon="lock-outline" secureTextEntry error={errors.password} />
          <InputField label="Confirm Password" value={form.confirmPassword}
            onChangeText={v => update('confirmPassword', v)} placeholder="Re-enter password"
            icon="lock-check-outline" secureTextEntry error={errors.confirmPassword} />

          <View style={styles.termsRow}>
            <MaterialCommunityIcons name="checkbox-marked" size={18} color={Colors.primary} />
            <Text style={styles.termsText}>I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text></Text>
          </View>

          {apiError ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          ) : null}

          <PrimaryButton title="Create Account" onPress={handleRegister} loading={isLoading} style={{ marginTop: Spacing.md }} />
        </Animated.View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login', { role: roleParam })}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBg: {
    paddingTop: 52,
    paddingBottom: 60,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: { ...textStyles.h3, color: '#fff', marginBottom: 4 },
  headerSubtitle: { ...textStyles.body, color: 'rgba(255,255,255,0.75)', marginBottom: Spacing.lg },
  stepsRow: { flexDirection: 'row', gap: Spacing.xl },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepActive: { backgroundColor: Colors.accent },
  stepNum: { ...textStyles.labelSmall, color: 'rgba(255,255,255,0.7)' },
  stepNumActive: { color: Colors.textPrimary },
  stepLabel: { ...textStyles.caption, color: 'rgba(255,255,255,0.7)' },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    marginHorizontal: Spacing.base,
    marginTop: -28,
    padding: Spacing.xl,
  },
  sectionTitle: { ...textStyles.h6, color: Colors.textPrimary, marginBottom: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.base },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: Spacing.sm },
  termsText: { ...textStyles.bodySmall, color: Colors.textSecondary, flex: 1 },
  termsLink: { color: Colors.primary, fontFamily: 'Poppins_500Medium' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerSurface || '#FFEBEE',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: { ...textStyles.caption, color: Colors.danger, flex: 1 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  loginText: { ...textStyles.body, color: Colors.textSecondary },
  loginLink: { ...textStyles.body, color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
});

export default RegisterScreen;
