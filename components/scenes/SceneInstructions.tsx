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
    // For custom scenes, prioritize the scene description
    if (scene.id === 'custom') {
      return scene.description;
    }

    const instructionsMap: Record<string, string> = {
      '1': 'The girl behind you in line looks cold, and seems like she wants to talk to you',
      '2': 'The show is about to start, and she seems disappointed at not having a seat',
      '3': 'She looks unsure about what snacks to choose for the Super Bowl party',
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

  return (
    <View style={[styles.container]}>
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
    backgroundColor: 'transparent', // Make background fully transparent
  },
  instructions: {
    textAlign: 'center',
    fontSize: 17, // Reduced font size to half
    lineHeight: 22, // Adjusted line height
    fontWeight: '400',
    letterSpacing: Platform.select({ web: -0.43, default: 0 }),
    padding: 0, // Remove internal padding
    margin: 0, // Remove internal margins
  },
});
