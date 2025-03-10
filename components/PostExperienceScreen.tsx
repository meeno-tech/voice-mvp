import { Dimensions, Linking, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from './ThemedText';

// Component to create a small star/dot
const Star = ({
  size = 2,
  left,
  top,
  opacity = 0.1,
  blur = 0,
}: {
  size?: number;
  left: number;
  top: number;
  opacity?: number;
  blur?: number;
}) => (
  <View
    className="absolute rounded-full bg-white"
    style={{
      width: size,
      height: size,
      left,
      top,
      opacity,
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: blur > 0 ? 0.8 : 0,
      shadowRadius: blur,
    }}
  />
);

// A disabled/dummy version of the CallExperience component
const CallExperiencePlaceholder = () => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        gap: 30,
        opacity: 0.6,
        width: '100%',
      }}>
      {/* Local participant dummy */}
      <View style={{ alignItems: 'center' }}>
        <View
          className="mb-2 h-20 w-20 items-center justify-center rounded-full bg-white/40"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}>
          <View className="h-12 flex-row items-center justify-center">
            {/* Static audio bars */}
            {[4, 6, 4, 7, 4].map((height, index) => (
              <View
                key={index}
                style={{
                  height,
                  width: 6,
                  marginHorizontal: 1.5,
                  backgroundColor: '#3B82F6',
                  opacity: 0.6,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>
        </View>
        <Text className="text-center text-base font-medium text-white/60">You</Text>
      </View>

      {/* AI participant dummy */}
      <View style={{ alignItems: 'center' }}>
        <View
          className="mb-2 h-20 w-20 items-center justify-center rounded-full bg-white/40"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}>
          <View className="h-12 flex-row items-center justify-center">
            {/* Static audio bars */}
            {[5, 3, 7, 5, 4].map((height, index) => (
              <View
                key={index}
                style={{
                  height,
                  width: 6,
                  marginHorizontal: 1.5,
                  backgroundColor: '#FD4C18',
                  opacity: 0.6,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>
        </View>
        <Text className="text-center text-base font-medium text-white/60">AI</Text>
      </View>
    </View>
  );
};

export const PostExperienceScreen = () => {
  const { width, height } = Dimensions.get('window');

  // Generate random stars
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    size: Math.random() > 0.7 ? 3 : 2,
    left: Math.random() * width,
    top: 100 + Math.random() * 700,
    opacity: Math.random() * 0.1 + 0.05,
    blur: Math.random() > 0.7 ? 2 : Math.random() > 0.5 ? 1 : 0,
  }));

  const openInstagram = () => {
    Linking.openURL('https://www.instagram.com/meeno.social/');
  };

  return (
    <View className="relative flex-1 bg-[#6556F8]">
      {/* Stars background */}
      {stars.map((star) => (
        <Star
          key={star.id}
          size={star.size}
          left={star.left}
          top={star.top}
          opacity={star.opacity}
          blur={star.blur}
        />
      ))}

      {/* Orange glow */}
      <View
        className="absolute rounded-full bg-[#FF9239] opacity-70"
        style={{
          width: 99,
          height: 153,
          left: Math.min(283, width - 100),
          top: 344,
          filter: 'blur(150px)',
        }}
      />

      {/* Flexible content container */}
      <View className="flex-1 px-4" style={{ paddingTop: height * 0.1 }}>
        {/* Safe area container with flex layout */}
        <View className="flex-1 flex-col justify-between">
          {/* Top section */}
          <View className="items-center opacity-30" style={{ marginBottom: height * 0.05 }}>
            <ThemedText
              className="text-center font-bold text-white"
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
              style={{ fontSize: 34 }}>
              Let&apos;s find your personality
            </ThemedText>
          </View>

          {/* Flexible spacer */}
          <View style={{ flex: 1 }} />

          {/* Middle section with Call Experience */}
          <View className="items-center opacity-30" style={{ marginBottom: height * 0.05 }}>
            <CallExperiencePlaceholder />
          </View>

          {/* Flexible spacer */}
          <View style={{ flex: 1 }} />

          {/* Bottom section */}
          <View className="items-center" style={{ marginBottom: height * 0.05 }}>
            {/* Thumbs up icon */}
            <View className="mb-6 h-[41px] w-[43px] items-center justify-center">
              <Text className="text-[34px] text-white">👍</Text>
            </View>

            <View className="w-full max-w-[292px] flex-col gap-[16px]">
              <Text className="text-center text-[28px] font-bold leading-[27px] text-white">
                Want to see more?
              </Text>
              <Text className="text-center text-[17px] leading-[22px] text-white opacity-60">
                Curiosity led you here, insights will keep you going
              </Text>
            </View>
          </View>

          {/* Follow on IG button */}
          <View className="items-center pb-8 pt-4">
            <TouchableOpacity
              className="h-[52px] w-full max-w-[362px] flex-row items-center justify-center rounded-[52px] bg-white"
              onPress={openInstagram}>
              <Svg width="24" height="24" viewBox="0 0 24 24" className="mr-2">
                <Path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                  fill="#000"
                />
              </Svg>
              <Text className="text-[17px] font-semibold text-black">Follow on IG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};
