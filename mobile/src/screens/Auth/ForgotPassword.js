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

const STEPS = ['Enter Email', 'Verify OTP', 'New Password'];

const ForgotPassword = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / 3,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const handleNext = async () => {
    const errs = {};
    if (step === 0) {
      if (!email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    } else if (step === 1) {
      if (otp.length < 6) errs.otp = 'Enter the 6-digit OTP';
    } else {
      if (!newPassword) errs.newPassword = 'Password is required';
      else if (newPassword.length < 8) errs.newPassword = 'Minimum 8 characters';
      if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);

    if (step < 2) {
      setStep(s => s + 1);
    } else {
      navigation.navigate('Login', { role: 'citizen' });
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={Colors.gradientDark} style={styles.headerBg}>
          <View style={styles.headerCircle} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.lockIcon}>
            <MaterialCommunityIcons name="lock-reset" size={34} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Forgot Password?</Text>
          <Text style={styles.headerSubtitle}>Don't worry! We'll help you reset it.</Text>
        </LinearGradient>

        <Animated.View style={[styles.formCard, Shadows.lg, { opacity: fadeAnim }]}>
          {/* Progress */}
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.stepsRow}>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                  {i < step ? (
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={styles.stepContent}>
            {step === 0 && (
              <>
                <Text style={styles.stepTitle}>Enter your Email</Text>
                <Text style={styles.stepDesc}>We'll send a verification code to your registered email address.</Text>
                <InputField
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  icon="email-outline"
                  keyboardType="email-address"
                  error={errors.email}
                />
              </>
            )}
            {step === 1 && (
              <>
                <View style={styles.sentBox}>
                  <MaterialCommunityIcons name="email-check-outline" size={24} color={Colors.primary} />
                  <Text style={styles.sentText}>OTP sent to <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{email}</Text></Text>
                </View>
                <Text style={styles.stepTitle}>Enter OTP</Text>
                <Text style={styles.stepDesc}>Enter the 6-digit code sent to your email. Valid for 10 minutes.</Text>
                <InputField
                  label="One-Time Password"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="• • • • • •"
                  icon="numeric"
                  keyboardType="number-pad"
                  error={errors.otp}
                />
                <TouchableOpacity style={styles.resendBtn}>
                  <Text style={styles.resendText}>Resend OTP in <Text style={{ color: Colors.primary }}>00:45</Text></Text>
                </TouchableOpacity>
              </>
            )}
            {step === 2 && (
              <>
                <Text style={styles.stepTitle}>Create New Password</Text>
                <Text style={styles.stepDesc}>Make sure your new password is strong and unique.</Text>
                <InputField
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 8 characters"
                  icon="lock-outline"
                  secureTextEntry
                  error={errors.newPassword}
                />
                <InputField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  icon="lock-check-outline"
                  secureTextEntry
                  error={errors.confirmPassword}
                />
                <View style={styles.passwordStrength}>
                  <Text style={styles.strengthLabel}>Password Strength:</Text>
                  {['Weak', 'Good', 'Strong'].map((s, i) => (
                    <View
                      key={s}
                      style={[
                        styles.strengthBar,
                        newPassword.length > i * 4 && { backgroundColor: i === 0 ? Colors.danger : i === 1 ? Colors.accent : Colors.primary },
                      ]}
                    />
                  ))}
                </View>
              </>
            )}

            <PrimaryButton
              title={step < 2 ? 'Continue' : 'Reset Password'}
              onPress={handleNext}
              loading={isLoading}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBg: { paddingTop: 52, paddingBottom: 50, paddingHorizontal: Spacing.base, overflow: 'hidden' },
  headerCircle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -40, right: -40,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  lockIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  headerTitle: { ...textStyles.h3, color: '#fff', marginBottom: 6 },
  headerSubtitle: { ...textStyles.body, color: 'rgba(255,255,255,0.75)' },
  formCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'],
    marginHorizontal: Spacing.base, marginTop: -24, padding: Spacing.xl,
  },
  progressBar: {
    height: 4, backgroundColor: Colors.borderLight,
    borderRadius: 2, marginBottom: Spacing.base, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepNum: { ...textStyles.labelSmall, color: Colors.textTertiary },
  stepNumActive: { color: '#fff' },
  stepLabel: { ...textStyles.caption, color: Colors.textTertiary, textAlign: 'center' },
  stepLabelActive: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  stepContent: {},
  stepTitle: { ...textStyles.h5, color: Colors.textPrimary, marginBottom: 6 },
  stepDesc: { ...textStyles.body, color: Colors.textSecondary, marginBottom: Spacing.base, lineHeight: 22 },
  sentBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  sentText: { ...textStyles.bodySmall, color: Colors.textSecondary, flex: 1 },
  resendBtn: { alignSelf: 'center', marginTop: Spacing.sm },
  resendText: { ...textStyles.label, color: Colors.textSecondary },
  passwordStrength: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: Spacing.sm },
  strengthLabel: { ...textStyles.caption, color: Colors.textTertiary },
  strengthBar: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border,
  },
});

export default ForgotPassword;
