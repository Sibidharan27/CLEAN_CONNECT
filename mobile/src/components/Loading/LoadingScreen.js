import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles } from '../../theme';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={['#F5F7FA', '#E8F5E9']} style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient colors={Colors.gradientPrimary} style={styles.iconBg}>
          <MaterialCommunityIcons name="recycle" size={40} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
        <View style={styles.spinnerInner} />
      </Animated.View>
      <Text style={styles.message}>{message}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: { marginBottom: 24 },
  iconBg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    borderTopColor: Colors.primary,
    marginBottom: 20,
  },
  spinnerInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: Colors.accent,
  },
  message: {
    ...textStyles.body,
    color: Colors.textSecondary,
  },
});

export default LoadingScreen;
