// components/ThemedText.tsx

import { Fonts } from 'constants/Fonts';
import { useThemeColor } from 'hooks/useThemeColor';
import { Platform, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text') as string;

  // Create the base style based on the type
  const baseStyle: TextStyle = {
    ...styles[type],
    color,
  };

  // Handle web-specific font styles
  if (Platform.OS === 'web') {
    Object.assign(baseStyle, {
      fontFamily: Fonts.system,
      fontWeight: Fonts.weights.normal,
    });
  }

  // Combine all styles
  const combinedStyle: TextStyle = StyleSheet.flatten([baseStyle, style]);

  return <Text style={combinedStyle} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.system,
    fontWeight: Fonts.weights.normal,
    letterSpacing: Platform.select({
      web: -0.011,
      default: 0,
    }),
  } as TextStyle,
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.system,
    fontWeight: Fonts.weights.semibold,
    letterSpacing: Platform.select({
      web: -0.011,
      default: 0,
    }),
  } as TextStyle,
  title: {
    fontSize: Platform.select({ web: 36, default: 32 }),
    fontFamily: Fonts.heading,
    fontWeight: Fonts.weights.bold,
    lineHeight: Platform.select({ web: 44, default: 32 }),
    letterSpacing: Platform.select({
      web: -0.02,
      default: 0,
    }),
  } as TextStyle,
  subtitle: {
    fontSize: 20,
    fontFamily: Fonts.heading,
    fontWeight: Fonts.weights.regular,
    lineHeight: Platform.select({ web: 26, default: 24 }),
    letterSpacing: Platform.select({
      web: -0.015,
      default: 0,
    }),
  } as TextStyle,
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: Fonts.system,
    fontWeight: Fonts.weights.medium,
    color: '#0a7ea4',
    letterSpacing: Platform.select({
      web: -0.011,
      default: 0,
    }),
  } as TextStyle,
});
