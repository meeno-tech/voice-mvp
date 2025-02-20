// components/scenes/SceneInstructions.tsx
import { ThemedText } from 'components/ThemedText';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { Scene } from 'types/scenes';

interface SceneInstructionsProps {
  scene: Scene;
}

/**
 * Displays scene-specific instructions to the user in an elegant, Apple-inspired design
 */
export function SceneInstructions({ scene }: SceneInstructionsProps) {
  // Map scene IDs to specific instructions
  const getInstructions = (scene: Scene): string => {
    const instructionsMap: Record<string, string> = {
      '1': 'The girl behind you in line looks cold, but seems like she wants to talk to you.',
      '2': 'The show is about to start, and she seems disappointed at not having a seat.',
      '3': 'She looks unsure about what snacks to choose for the Super Bowl party.',
      // Add more scene-specific instructions as needed
    };

    return instructionsMap[scene.id] || scene.description;
  };

  const instructions = getInstructions(scene);

  // Conditionally render different containers based on platform
  if (Platform.OS === 'ios') {
    return (
      <BlurView tint="light" intensity={75} style={styles.container}>
        <ThemedText style={styles.instructions}>{instructions}</ThemedText>
      </BlurView>
    );
  }

  // For other platforms (Android, web)
  return (
    <View style={[styles.container, { backgroundColor: 'rgba(255, 255, 255, 0.85)' }]}>
      <ThemedText style={styles.instructions}>{instructions}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Platform.select({ web: 20, default: 16 }),
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 24,
    maxWidth: 600,
    alignSelf: 'center',
    ...Platform.select({
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
    }),
  },
  instructions: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: Platform.select({ web: -0.2, default: 0 }),
  },
});
