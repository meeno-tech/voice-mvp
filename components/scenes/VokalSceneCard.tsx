import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { Scene } from 'types/scenes';
import { supabase } from 'utils/supabase';

interface VokalSceneCardProps {
  scene: Scene;
  onPress: () => void;
  cardWidth: number;
  cardHeight: number;
}

// Base dimensions from the mockup for scaling calculations
const BASE_CARD_WIDTH = 319;
const BASE_FONT_SIZES = {
  titleLarge: 27, // Updated to match design spec
  titleSmall: 27, // Keeping consistent with large for uniformity
  subtitle: 14,
  button: 17,
  footer: 12,
};

// Function to scale dimensions based on card width
const getScaledSize = (baseSize: number, currentWidth: number) => {
  return (baseSize * currentWidth) / BASE_CARD_WIDTH;
};

export default function VokalSceneCard({
  scene,
  onPress,
  cardWidth,
  cardHeight,
}: VokalSceneCardProps) {
  let imageUrl = scene.imageUrl;
  if (imageUrl) {
    const { data } = supabase.storage.from('scene_images').getPublicUrl(imageUrl);
    imageUrl = data.publicUrl;
  }

  // Scale font sizes based on card width
  const scaledFontSizes = {
    titleLarge: getScaledSize(BASE_FONT_SIZES.titleLarge, cardWidth),
    titleSmall: getScaledSize(BASE_FONT_SIZES.titleSmall, cardWidth),
    subtitle: getScaledSize(BASE_FONT_SIZES.subtitle, cardWidth),
    button: getScaledSize(BASE_FONT_SIZES.button, cardWidth),
    footer: getScaledSize(BASE_FONT_SIZES.footer, cardWidth),
  };

  // Scale button height and padding
  const buttonHeight = getScaledSize(48, cardWidth);
  const buttonPadding = getScaledSize(15, cardWidth);
  const buttonPaddingHorizontal = getScaledSize(24, cardWidth);

  return (
    <View className="flex flex-col items-center">
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
        }}
        className="overflow-hidden rounded-[32px] bg-white">
        <ImageBackground
          source={{ uri: imageUrl }}
          className="h-full w-full justify-end"
          resizeMode="cover">
          <LinearGradient
            colors={['transparent', '#38250F', '#38250F']}
            locations={[0, 0.8, 1]}
            className="absolute inset-0"
          />

          <View
            style={{
              position: 'absolute',
              bottom: getScaledSize(32, cardWidth),
              left: getScaledSize(16, cardWidth),
              right: getScaledSize(16, cardWidth),
              gap: getScaledSize(10, cardWidth),
            }}>
            <View
              style={{
                width: cardWidth - getScaledSize(32, cardWidth),
                alignItems: 'center',
                gap: getScaledSize(4, cardWidth),
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: scaledFontSizes.titleLarge,
                  fontWeight: '400',
                  color: '#FFFFFF',
                  fontFamily: 'DelaGothicOne',
                  lineHeight: 31.66,
                }}>
                {scene.title.toUpperCase()}
              </Text>
            </View>

            <Text
              style={{
                fontSize: scaledFontSizes.subtitle,
                letterSpacing: 0,
                textAlign: 'center',
                color: '#FFFFFF80',
                fontWeight: '400',
              }}>
              {scene.description}
            </Text>

            <TouchableOpacity
              onPress={onPress}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: buttonPadding,
                paddingHorizontal: buttonPaddingHorizontal,
                height: buttonHeight,
                backgroundColor: '#FFFFFF',
                borderRadius: buttonHeight / 2,
                gap: getScaledSize(8, cardWidth),
                alignSelf: 'stretch',
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}>
              <Ionicons name="radio-outline" size={20} color="black" />
              <Text
                style={{
                  fontSize: scaledFontSizes.button,
                  lineHeight: scaledFontSizes.button * 1.3,
                  fontWeight: '600',
                  letterSpacing: -0.3,
                  color: '#38250F',
                  textAlign: 'center',
                }}>
                Start
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: scaledFontSizes.footer,
                lineHeight: scaledFontSizes.footer * 1.38,
                fontWeight: '600',
                letterSpacing: 0.2,
                textAlign: 'center',
                color: '#FFFFFF80',
                marginTop: getScaledSize(4, cardWidth),
              }}>
              {scene.difficulty.toUpperCase()} / +{scene.xpReward} XP
            </Text>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}
