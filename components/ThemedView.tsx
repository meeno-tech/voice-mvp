import { useThemeColor } from 'hooks/useThemeColor';
import { ColorValue, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView(props: ThemedViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  ) as ColorValue;

  const baseStyle: ViewStyle = {
    backgroundColor,
  };

  // Combine styles properly
  let combinedStyle: ViewStyle | ViewStyle[];
  if (Array.isArray(style)) {
    combinedStyle = [baseStyle, ...(style.filter(Boolean) as ViewStyle[])];
  } else if (style) {
    combinedStyle = [baseStyle, StyleSheet.flatten(style)];
  } else {
    combinedStyle = baseStyle;
  }

  return <View style={combinedStyle} {...otherProps} />;
}
