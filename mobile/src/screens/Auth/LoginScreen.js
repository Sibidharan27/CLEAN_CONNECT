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
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation, route }) => {
  const { login, isLoading } = useAuth();
  const roleParam = route?.params?.role || 'citizen';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setApiError('');
    try {
      await login(email, password);
    } catch (e) {
      setApiError(e.message || 'Login failed. Please check your credentials.');
    }
  };

  const isDriver = roleParam === 'driver';
  const isCitizen = !isDriver;

  // ── Theme palette based on role ─────────────────────────────────────────────
  const gradientColors = isDriver
    ? ['#0D47A1', '#1565C0', '#1976D2']
    : Colors.gradientDark;
  const accentColor = isDriver ? '#90CAF9' : Colors.accent;
  const primaryColor = isDriver ? '#1565C0' : Colors.primary;
  const buttonGradient = isDriver ? ['#0D47A1', '#1565C0'] : Colors.gradientPrimary;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient colors={gradientColors} style={styles.headerBg}>
          <View style={styles.headerCircle} />
          <View style={styles.headerCircle2} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={[styles.roleChip, { backgroundColor: accentColor + '30' }]}>
              <MaterialCommunityIcons
                name={isCitizen ? 'account-outline' : 'truck-outline'}
                size={14}
                color={accentColor}
              />
              <Text style={[styles.roleChipText, { color: accentColor }]}>
                {isCitizen ? 'Citizen' : 'Driver'} Login
              </Text>
            </View>
            <Text style={styles.headerTitle}>Welcome Back!</Text>
            <Text style={styles.headerSubtitle}>Sign in to your CleanConnect+ account</Text>
          </View>
        </LinearGradient>

        {/* ── Form Card ── */}
        <Animated.View
          style={[styles.formCard, Shadows.lg, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <InputField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            icon="email-outline"
            error={errors.email}
            autoCapitalize="none"
            accentColor={primaryColor}
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            icon="lock-outline"
            error={errors.password}
            accentColor={primaryColor}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.forgotText, { color: primaryColor }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            colors={buttonGradient}
            style={{ marginTop: Spacing.sm }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* API Error */}
          {apiError ? (
            <View style={styles.errorHint}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* ── Register Link ── */}
        <Animated.View style={[styles.registerRow, { opacity: fadeAnim }]}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register', { role: roleParam })}>
            <Text style={[styles.registerLink, { color: primaryColor }]}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  headerBg: {
    paddingTop: 52,
    paddingBottom: 50,
    paddingHorizontal: Spacing.base,
    position: 'relative',
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
  headerCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -30,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  headerContent: {},
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  roleChipText: { ...textStyles.labelSmall, fontFamily: 'Poppins_600SemiBold' },
  headerTitle: { ...textStyles.h2, color: '#fff', marginBottom: 6 },
  headerSubtitle: { ...textStyles.body, color: 'rgba(255,255,255,0.75)' },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    marginHorizontal: Spacing.base,
    marginTop: -24,
    padding: Spacing.xl,
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: Spacing.md },
  forgotText: { ...textStyles.label },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.base,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: {
    ...textStyles.caption,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.md,
  },
  errorHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerSurface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: 6,
  },
  errorText: { ...textStyles.caption, color: Colors.danger, flex: 1 },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  registerText: { ...textStyles.body, color: Colors.textSecondary },
  registerLink: { ...textStyles.body, fontFamily: 'Poppins_600SemiBold' },
});

export default LoginScreen;
