import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useBottomTabOverflow() {
  const insets = useSafeAreaInsets();

  // On iOS and web, we want to include the safe area
  // On Android, the system handles this
  return Platform.select({
    ios: 49 + insets.bottom,
    web: 100 + 16, // Add some padding for web
    default: 49,
  });
}
