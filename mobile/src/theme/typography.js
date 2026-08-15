import { StyleSheet } from 'react-native';

export const Typography = {
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    light: 'Poppins_300Light',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const textStyles = StyleSheet.create({
  h1: { fontSize: 32, fontFamily: 'Poppins_700Bold', lineHeight: 40 },
  h2: { fontSize: 28, fontFamily: 'Poppins_700Bold', lineHeight: 36 },
  h3: { fontSize: 24, fontFamily: 'Poppins_600SemiBold', lineHeight: 32 },
  h4: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', lineHeight: 28 },
  h5: { fontSize: 18, fontFamily: 'Poppins_500Medium', lineHeight: 26 },
  h6: { fontSize: 16, fontFamily: 'Poppins_500Medium', lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontFamily: 'Poppins_400Regular', lineHeight: 24 },
  body: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  bodySmall: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  labelLarge: { fontSize: 14, fontFamily: 'Poppins_500Medium', lineHeight: 20 },
  label: { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 18 },
  labelSmall: { fontSize: 10, fontFamily: 'Poppins_500Medium', lineHeight: 16 },
  caption: { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  overline: { fontSize: 10, fontFamily: 'Poppins_500Medium', lineHeight: 16, letterSpacing: 1.5, textTransform: 'uppercase' },
  button: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20, letterSpacing: 0.5 },
  buttonLarge: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 24, letterSpacing: 0.5 },
  buttonSmall: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 18, letterSpacing: 0.5 },
});
