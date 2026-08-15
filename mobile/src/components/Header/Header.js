import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, textStyles, Spacing, Shadows } from '../../theme';

const Header = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightComponent,
  rightIcon,
  onRightPress,
  transparent = false,
  light = false,
  style,
}) => {
  const insets = useSafeAreaInsets();

  const textColor = light ? Colors.textInverse : Colors.textPrimary;
  const iconColor = light ? Colors.textInverse : Colors.textPrimary;
  const bgColor = transparent ? 'transparent' : Colors.surface;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, paddingTop: insets.top + 8 },
        !transparent && Shadows.sm,
        style,
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
        <View style={[styles.titleContainer, showBack && styles.titleWithBack]}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: light ? 'rgba(255,255,255,0.7)' : Colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {(rightComponent || rightIcon) && (
          <View style={styles.rightContainer}>
            {rightComponent || (
              <TouchableOpacity
                style={styles.rightBtn}
                onPress={onRightPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name={rightIcon} size={24} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginRight: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  titleContainer: { flex: 1 },
  titleWithBack: { marginLeft: 4 },
  title: { ...textStyles.h6 },
  subtitle: { ...textStyles.caption, marginTop: 1 },
  rightContainer: { marginLeft: 'auto' },
  rightBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
});

export default Header;
