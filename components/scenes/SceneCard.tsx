import { ThemedText } from 'components/ThemedText';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { useColorScheme } from 'hooks/useColorScheme';
// import { supabase } from "supabaseClient";
import React from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Scene } from 'types/scenes';

import { supabase } from '../../utils/supabase';

interface SceneCardProps {
  scene: Scene;
  onPress: (scene: Scene) => void;
}

export function SceneCard({ scene, onPress }: SceneCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const getDifficultyColor = (difficulty: Scene['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return Colors[theme].success;
      case 'intermediate':
        return Colors[theme].warning;
      case 'advanced':
        return Colors[theme].error;
    }
  };

  // If scene.imageUrl is defined, generate the public URL from Supabase.
  let imageUrl = scene.imageUrl;
  if (imageUrl) {
    const { data } = supabase.storage.from('scene_images').getPublicUrl(imageUrl);
    imageUrl = data.publicUrl;
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: Colors[theme].surfaceElement }]}
      onPress={() => onPress(scene)}>
      <View style={styles.innerContainer}>
        <View style={styles.imageContainer}>
          {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />}
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(scene.difficulty) },
            ]}>
            <ThemedText style={styles.difficultyText} lightColor="#000000" darkColor="#000000">
              {scene.difficulty}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          <ThemedText type="subtitle" style={styles.title} numberOfLines={2}>
            {scene.title}
          </ThemedText>

          <ThemedText style={styles.description} numberOfLines={2}>
            {scene.description}
          </ThemedText>
        </View>

        {scene.isLocked && (
          <View style={styles.lockedOverlay}>
            <IconSymbol name="lock.fill" size={48} color={Colors[theme].text} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    height: Platform.select({ web: 240, default: 250 }),
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  innerContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: Platform.select({ web: 140, default: 140 }),
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    padding: 12,
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  difficultyText: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
