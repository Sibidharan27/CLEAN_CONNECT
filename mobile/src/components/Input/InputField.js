import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  icon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  containerStyle,
  autoCapitalize = 'none',
  accentColor = null, // optional override for focus color (e.g. blue for driver)
}) => {
  const focusColor = accentColor || Colors.inputFocused;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.danger : Colors.inputBorder, error ? Colors.danger : focusColor],
  });

  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.danger : Colors.textSecondary, error ? Colors.danger : focusColor],
  });

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Animated.Text style={[styles.label, { color: labelColor }]}>
          {label}
        </Animated.Text>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.focusedContainer,
          error && styles.errorContainer,
          !editable && styles.disabledContainer,
          multiline && { height: numberOfLines * 44, alignItems: 'flex-start', paddingTop: 12 },
          style,
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isFocused ? focusColor : Colors.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            !editable && styles.disabledInput,
          ]}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIconBtn}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
            <MaterialCommunityIcons name={rightIcon} size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </Animated.View>
      {error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.base },
  label: {
    ...textStyles.label,
    marginBottom: 6,
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  focusedContainer: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  errorContainer: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerSurface,
  },
  disabledContainer: {
    backgroundColor: Colors.borderLight,
    opacity: 0.7,
  },
  leftIcon: { marginRight: Spacing.sm },
  rightIconBtn: { padding: 4 },
  input: {
    flex: 1,
    ...textStyles.body,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  inputWithIcon: {},
  inputWithRightIcon: { paddingRight: 4 },
  multilineInput: { textAlignVertical: 'top' },
  disabledInput: { color: Colors.textTertiary },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    ...textStyles.caption,
    color: Colors.danger,
    marginLeft: 4,
  },
});

export default InputField;
