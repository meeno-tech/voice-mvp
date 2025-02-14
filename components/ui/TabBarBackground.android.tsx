import { Colors } from 'constants/Colors';
import { useColorScheme } from 'hooks/useColorScheme';
import { StyleSheet, View } from 'react-native';

export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View
      style={[
        styles.container,
        {
          height: 49,
          backgroundColor: Colors[theme].tabBar.background,
          borderTopColor: Colors[theme].tabBar.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    elevation: 8,
  },
});
