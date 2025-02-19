import PaywallModal from 'components/PaywallModal';
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { SceneCard } from 'components/scenes/SceneCard';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scene, mockScenes } from 'types/scenes';

export default function ScenesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [showPaywall, setShowPaywall] = useState(false);

  // Calculate the number of columns based on screen width
  const numColumns = Platform.select({
    web: Math.max(2, Math.floor(width / 400)),
    default: 2,
  });

  const handleScenePress = useCallback((scene: Scene) => {
    if (scene.isLocked) {
      if (Platform.OS === 'web') {
        setShowPaywall(true);
      } else {
        alert(
          'This scene is currently locked. Please use the web version to unlock premium content.'
        );
      }
      return;
    }

    // Add timestamp to force component refresh on navigation
    // TODO: Remove this workaround...it's just a quick fix for 2/18...famous last words
    const timestamp = Date.now();
    const roomPath = `/(tabs)/${scene.roomName.toLowerCase()}?t=${timestamp}`;

    // For web platform, use window.location for a full refresh
    if (Platform.OS === 'web') {
      const baseUrl = window.location.origin;
      const fullPath = `${baseUrl}${roomPath}`;
      window.location.href = fullPath;
    } else {
      // For native platforms, use router.push
      router.push(roomPath);
    }
  }, []);

  const handlePaywallContinue = useCallback(() => {
    setShowPaywall(false);

    // TODO: To implement actual unlocking:
    // 1. Integrate with your payment processing system
    // 2. After successful payment, update the user's subscription status in Supabase
    // 3. Update the local state/cache to reflect unlocked content
    // 4. Consider adding a proper subscription management system
    // 5. You might want to store unlocked status in Supabase and sync across devices

    // For now, just close the paywall and keep the scene locked
    alert('This scene will be available in the full version!');
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          padding: Platform.OS === 'web' ? 8 : 16,
          paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 20),
          paddingBottom: insets.bottom + 20,
        }}>
        <ThemedText type="title" style={styles.title}>
          Scenery
        </ThemedText>

        <ThemedText style={styles.subtitle}>Where would you love to meet someone new?</ThemedText>

        <View style={styles.gridContainer}>
          {mockScenes.map((scene, index) => (
            <View
              key={scene.id}
              style={[
                styles.cardWrapper,
                {
                  width: `${100 / numColumns}%`,
                  transform:
                    Platform.OS !== 'web' ? [{ translateY: index % 2 === 0 ? 0 : 20 }] : undefined,
                },
              ]}>
              <SceneCard scene={scene} onPress={handleScenePress} />
            </View>
          ))}
        </View>
      </ScrollView>

      {Platform.OS === 'web' && showPaywall && <PaywallModal onContinue={handlePaywallContinue} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 72,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: Platform.select({ web: 48, default: 32 }),
    marginBottom: Platform.select({ web: 14, default: 16 }),
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: Platform.select({ web: 20, default: 16 }),
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
    maxWidth: '75%',
    alignSelf: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  cardWrapper: {
    padding: 8,
  },
});
