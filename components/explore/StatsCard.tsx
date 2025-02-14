import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { useColorScheme } from 'hooks/useColorScheme';

export function StatsCard() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <Animated.View entering={FadeInUp.delay(700).springify()} style={styles.statsContainer}>
      <ThemedView style={styles.statsCard}>
        {Platform.OS === 'ios' && (
          <BlurView
            style={StyleSheet.absoluteFill}
            tint={theme === 'dark' ? 'dark' : 'light'}
            intensity={40}
          />
        )}
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <View style={styles.statContent}>
              <ThemedText type="title" style={styles.statNumber}>
                50K+
              </ThemedText>
              <ThemedText style={styles.statLabel}>Active Learners</ThemedText>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <View style={styles.statContent}>
              <ThemedText type="title" style={styles.statNumber}>
                4.9
              </ThemedText>
              <ThemedText style={styles.statLabel}>App Rating</ThemedText>
            </View>
          </View>
        </View>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: Platform.OS === 'web' ? 60 : 32,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 0,
  } as ViewStyle,
  statsCard: {
    borderRadius: Platform.OS === 'web' ? 24 : 20,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }
      : Platform.OS === 'android'
        ? { elevation: 4 }
        : {}),
  } as ViewStyle,
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 40 : 24,
  } as ViewStyle,
  stat: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  statContent: {
    alignItems: 'center',
    height: Platform.OS === 'web' ? 80 : 70,
    justifyContent: 'space-between',
  } as ViewStyle,
  statNumber: {
    fontSize: Platform.OS === 'web' ? 48 : 32,
    lineHeight: Platform.OS === 'web' ? 56 : 40,
  } as TextStyle,
  statLabel: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    opacity: 0.7,
    textAlign: 'center',
  } as TextStyle,
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginHorizontal: Platform.OS === 'web' ? 40 : 20,
  } as ViewStyle,
});
