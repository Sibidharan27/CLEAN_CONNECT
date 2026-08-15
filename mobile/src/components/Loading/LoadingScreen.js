import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const pulseAnim = useRef(null);

  // No heavy animations — faster perceived load
  return (
    <LinearGradient colors={['#1B5E20', '#2E7D32', '#388E3C']} style={styles.container}>
      <View style={styles.logoCircle}>
        <MaterialCommunityIcons name="recycle" size={48} color="#fff" />
      </View>
      <Text style={styles.appName}>CleanConnect+</Text>
      <Text style={styles.tagline}>Smart Waste Management</Text>
      <View style={styles.loaderBar}>
        <View style={styles.loaderFill} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 32,
  },
  loaderBar: {
    width: '60%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loaderFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
});

export default LoadingScreen;
