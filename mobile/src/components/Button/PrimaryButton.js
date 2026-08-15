import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, textStyles, Shadows, BorderRadius, Spacing } from '../../theme';

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon = null,
  size = 'large',
  style,
  textStyle,
  gradient = true,
  colors = null, // optional custom gradient colors, e.g. ['#0D47A1', '#1565C0']
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }),
      Animated.timing(opacityAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const heights = { small: 40, medium: 48, large: 56 };
  const btnHeight = heights[size] || 56;

  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        styles.container,
        Shadows.primary,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={{ borderRadius: BorderRadius.lg }}
      >
        {gradient ? (
          <LinearGradient
            colors={isDisabled ? ['#BDBDBD', '#9E9E9E'] : (colors || Colors.gradientPrimary)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { height: btnHeight, borderRadius: BorderRadius.lg }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.content}>
                {icon && <View style={styles.iconWrap}>{icon}</View>}
                <Text style={[styles.text, textStyle]}>{title}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.solidBtn,
              { height: btnHeight, backgroundColor: isDisabled ? '#BDBDBD' : Colors.primary },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.content}>
                {icon && <View style={styles.iconWrap}>{icon}</View>}
                <Text style={[styles.text, textStyle]}>{title}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  solidBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: Spacing.sm,
  },
  text: {
    ...textStyles.button,
    color: Colors.textOnPrimary,
    fontSize: 16,
  },
});

export default PrimaryButton;
