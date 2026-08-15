import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../theme';

const Card = ({
  children,
  style,
  shadow = 'md',
  padding = true,
  borderRadius = 'lg',
  backgroundColor = Colors.surface,
  onPress,
}) => {
  const shadowStyle = Shadows[shadow] || Shadows.md;
  const radiusValue = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24 }[borderRadius] || 16;

  return (
    <View
      style={[
        styles.card,
        shadowStyle,
        {
          borderRadius: radiusValue,
          backgroundColor,
          padding: padding ? Spacing.base : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
});

export default Card;
