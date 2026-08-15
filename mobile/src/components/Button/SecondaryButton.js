import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { Colors, textStyles, BorderRadius, Spacing } from '../../theme';

const SecondaryButton = ({
  title,
  onPress,
  disabled = false,
  icon = null,
  size = 'large',
  variant = 'outline',
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const heights = { small: 40, medium: 48, large: 52 };
  const btnHeight = heights[size] || 52;

  const isOutline = variant === 'outline';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          { height: btnHeight },
          isOutline ? styles.outline : styles.ghost,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              isOutline ? styles.outlineText : styles.ghostText,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: Colors.primarySurface,
  },
  disabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: { marginRight: Spacing.sm },
  text: { ...textStyles.button },
  outlineText: { color: Colors.primary },
  ghostText: { color: Colors.primary },
  disabledText: { color: Colors.textTertiary },
});

export default SecondaryButton;
