import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles } from '../../theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const circleScale1 = useRef(new Animated.Value(0)).current;
  const circleScale2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Circles bloom
      Animated.parallel([
        Animated.spring(circleScale1, { toValue: 1, tension: 30, friction: 6, useNativeDriver: true }),
        Animated.delay(200),
      ]),
      Animated.spring(circleScale2, { toValue: 1, tension: 30, friction: 6, useNativeDriver: true }),
      // Logo pop
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Text slide up
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(textTranslate, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      // Tagline fade
      Animated.delay(150),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Navigate to role selection after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('RoleSelection');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#1B5E20', '#2E7D32', '#4CAF50']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative circles */}
      <Animated.View style={[styles.circle1, { transform: [{ scale: circleScale1 }] }]} />
      <Animated.View style={[styles.circle2, { transform: [{ scale: circleScale2 }] }]} />
      <Animated.View style={[styles.circle3, { transform: [{ scale: circleScale1 }] }]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <View style={styles.logoBg}>
          <MaterialCommunityIcons name="recycle" size={52} color={Colors.primary} />
        </View>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="truck-fast" size={16} color="#fff" />
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslate }],
          alignItems: 'center',
        }}
      >
        <Text style={styles.appName}>CleanConnect</Text>
        <Text style={styles.plus}>+</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Smart Waste Management System
      </Animated.Text>

      {/* Bottom dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { opacity: taglineOpacity },
              i === 1 && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Version */}
      <Animated.Text style={[styles.version, { opacity: taglineOpacity }]}>
        Municipal Corporation of Chennai
      </Animated.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -width * 0.1,
    left: -width * 0.15,
  },
  circle3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: height * 0.2,
    right: -width * 0.05,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logoBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  logoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  appName: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  plus: {
    position: 'absolute',
    right: -18,
    top: 2,
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    color: Colors.accent,
  },
  tagline: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#fff',
  },
  version: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.5)',
    position: 'absolute',
    bottom: 40,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
