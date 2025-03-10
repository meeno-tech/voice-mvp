import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { Scene } from 'types/scenes';
import { supabase } from 'utils/supabase';

interface MeenoSceneCardProps {
  scene: Scene;
  onPress: () => void;
  cardWidth: number;
  cardHeight: number;
}

export default function MeenoSceneCard({
  scene,
  onPress,
  cardWidth,
  cardHeight,
}: MeenoSceneCardProps) {
  let imageUrl = scene.imageUrl;
  if (imageUrl) {
    const { data } = supabase.storage.from('scene_images').getPublicUrl(imageUrl);
    imageUrl = data.publicUrl;
  }

  return (
    <View style={{ width: cardWidth, height: cardHeight }} className="bg-white">
      <View className="relative h-full overflow-hidden rounded-3xl shadow-sm">
        <ImageBackground
          source={{ uri: imageUrl }}
          className="h-full w-full justify-end"
          resizeMode="cover">
          <LinearGradient
            colors={
              scene.isLocked
                ? ['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.7)']
                : ['transparent', '#38250F', '#38250F']
            }
            locations={[0, 0.8, 1]}
            className={`absolute inset-0 ${scene.isLocked ? 'z-10' : ''}`}
          />
          <View className="absolute bottom-6 left-4 right-4">
            <Text
              className="mb-1 px-2 text-center text-3xl font-bold text-white"
              style={{ fontFamily: 'DelaGothicOne' }}>
              {scene.title.toUpperCase()}
            </Text>
            <Text className="text-center text-[12px] text-white/90">{scene.description}</Text>
            {scene.isLocked ? (
              <View className="mt-4 flex-row items-center justify-center rounded-full bg-white py-3">
                <Ionicons name="lock-closed" size={20} color="black" />
                <Text className="ml-2 text-lg font-semibold text-black">Locked</Text>
              </View>
            ) : (
              <TouchableOpacity
                className="mt-4 flex-row items-center justify-center rounded-full bg-white py-3"
                onPress={onPress}>
                <Ionicons name="radio-outline" size={20} color="black" />
                <Text className="ml-2 text-lg font-semibold text-black">Start</Text>
              </TouchableOpacity>
            )}
            <Text className="mt-3 text-center text-sm text-gray-300">BEGINNER / +10 XP</Text>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}
