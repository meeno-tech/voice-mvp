import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { mixpanel } from 'utils/mixpanel';
import { supabase } from 'utils/supabase';

// Web-specific background video component to avoid findDOMNode warning
const WebBackgroundVideo = ({ videoUrl }: { videoUrl: string }) => {
  return Platform.OS === 'web' ? (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
      }}>
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          opacity: 0.25,
        }}
      />
    </div>
  ) : null;
};

// Native background video component
const NativeBackgroundVideo = ({ videoUrl }: { videoUrl: string }) => {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playAsync().catch((error) => {
        console.warn('Error playing native video:', error);
      });
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [videoUrl]);

  return (
    <Video
      ref={videoRef}
      source={{ uri: videoUrl }}
      resizeMode={ResizeMode.COVER}
      isLooping
      isMuted
      shouldPlay
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.15,
        zIndex: -1,
      }}
      useNativeControls={false}
      rate={1.0}
      progressUpdateIntervalMillis={1000}
    />
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [brandImageUrl, setBrandImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const { height } = useWindowDimensions();

  // Calculate responsive spacing based on screen height
  const getResponsiveSpacing = () => {
    // For very small screens (under 600px)
    if (height < 600) {
      return {
        containerPadding: Math.max(16, height * 0.03),
        componentGap: Math.max(16, height * 0.03),
        innerGap: Math.max(8, height * 0.015),
      };
    }

    // For medium screens (600px - 900px)
    if (height < 900) {
      return {
        containerPadding: Math.max(24, height * 0.04),
        componentGap: Math.max(20, height * 0.035),
        innerGap: Math.max(12, height * 0.02),
      };
    }

    // For large screens (900px - 1200px)
    if (height < 1200) {
      return {
        containerPadding: Math.max(32, height * 0.05),
        componentGap: Math.max(28, height * 0.04),
        innerGap: Math.max(16, height * 0.025),
      };
    }

    // For very large screens (1200px+)
    return {
      containerPadding: Math.max(40, height * 0.06),
      componentGap: Math.max(36, height * 0.045),
      innerGap: Math.max(20, height * 0.03),
    };
  };

  const spacing = getResponsiveSpacing();

  useEffect(() => {
    // Load brand image
    const { data: brandData } = supabase.storage.from('app_assets').getPublicUrl('meeno_large.png');
    setBrandImageUrl(brandData.publicUrl);

    // Get video URL directly (simplified approach)
    try {
      const { data: videoData } = supabase.storage
        .from('videos')
        .getPublicUrl('scenes/pizza_bg.mp4');

      console.log('Video URL:', videoData.publicUrl);
      setVideoUrl(videoData.publicUrl);
      setVideoLoading(false);
    } catch (error) {
      console.error('Error loading video:', error);
      setVideoError(true);
      setVideoLoading(false);
    }

    mixpanel.track('Home Page Viewed', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleDemoPress = () => {
    mixpanel.track('Demo Button Pressed');
    router.push('/(home)/demo');
  };

  const openInstagram = () => {
    mixpanel.track('Instagram Share Button Pressed');
    Linking.openURL('https://www.instagram.com/meeno.social/');
  };

  return (
    <View className="flex-1">
      {/* Platform-specific background video */}
      {!videoLoading &&
        videoUrl &&
        !videoError &&
        (Platform.OS === 'web' ? (
          <WebBackgroundVideo videoUrl={videoUrl} />
        ) : (
          <NativeBackgroundVideo videoUrl={videoUrl} />
        ))}

      <LinearGradient
        colors={['rgba(7, 166, 105, 0.6)', 'rgba(255, 255, 255, 0)']}
        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Platform.OS === 'ios' ? 0 : 0,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Main container - single flex column */}
        <View
          className="pt-safe flex-1 flex-col items-center justify-center px-4"
          style={{
            zIndex: 1,
            paddingTop: spacing.containerPadding,
            paddingBottom: spacing.containerPadding,
          }}>
          <View
            className="w-full max-w-[340px] flex-col items-center"
            style={{
              gap: spacing.componentGap,
            }}>
            {/* Title/Subtitle Section */}
            <View className="items-center">
              {/* Logo */}
              <Image
                source={{ uri: brandImageUrl }}
                className="h-[50px] w-[200px]"
                resizeMode="contain"
                style={{ tintColor: 'white' }}
              />

              {/* Subtitle */}
              <Text
                className="text-center text-[16px] font-light text-gray-700 md:text-[17px]"
                style={{ marginTop: spacing.innerGap }}>
                To start your journey, it&apos;s best to use headphones or find a quiet spot.
              </Text>
            </View>

            {/* Instagram Button */}
            <TouchableOpacity
              className="h-[52px] w-full flex-row items-center justify-center gap-2.5 rounded-[52px] px-6"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.15)',
              }}
              onPress={openInstagram}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                  fill="#000"
                />
              </Svg>
              <Text className="text-[17px] font-normal text-black">Follow Meeno on IG</Text>
            </TouchableOpacity>

            {/* Features Card */}
            <View className="w-full rounded-[28px] bg-white p-4 shadow-sm">
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: height < 600 ? 16 : height < 900 ? 24 : height < 1200 ? 32 : 40,
                }}>
                {/* Feature 1 */}
                <View className="flex-row items-center gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full border border-[#F2F2F7]">
                    <Ionicons name="clipboard-outline" size={20} color="#07A669" />
                  </View>
                  <View className="flex-1 flex-col gap-0.5">
                    <Text className="text-[16px] font-semibold text-black">Personality test</Text>
                    <Text className="text-[15px] text-gray-500">
                      Learn what first impression you make with a 2 minute voice test
                    </Text>
                  </View>
                </View>

                {/* Feature 2 */}
                <View className="flex-row items-center gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full border border-[#F2F2F7]">
                    <Ionicons name="chatbubbles-outline" size={20} color="#07A669" />
                  </View>
                  <View className="flex-1 flex-col gap-0.5">
                    <Text className="text-[16px] font-semibold text-black">
                      Duolingo for dating
                    </Text>
                    <Text className="text-[15px] text-gray-500">
                      Practice lifelike conversations with girls, using voice-based AI
                    </Text>
                  </View>
                </View>

                {/* Feature 3 */}
                <View className="flex-row items-center gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full border border-[#F2F2F7]">
                    <Ionicons name="flame-outline" size={20} color="#07A669" />
                  </View>
                  <View className="flex-1 flex-col gap-0.5">
                    <Text className="text-[16px] font-semibold text-black">
                      Real-world challenges
                    </Text>
                    <Text className="text-[15px] text-gray-500">
                      Master the art of flirting with confidence in any situation
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Try Demo Button */}
            <TouchableOpacity
              className="h-[48px] w-full items-center justify-center rounded-[48px] bg-[#07A669]"
              onPress={handleDemoPress}>
              <Text className="text-[16px] font-normal text-white">Try Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
