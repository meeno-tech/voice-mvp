import { Ionicons } from '@expo/vector-icons';
import { AuthModal } from 'components/auth/AuthModal';
import VokalSceneCard from 'components/scenes/VokalSceneCard';
import CreateRoomButton from 'components/ui/CreateRoomButton';
import { useAuth } from 'contexts/AuthContext';
import { useRouter } from 'expo-router';
import * as Share from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { Scene, mockScenes } from 'types/scenes';
import { mixpanel } from 'utils/mixpanel';
import { supabase } from 'utils/supabase';

export default function HomeScreen() {
  const { user, signOut, isAnonymous } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState('');
  const [index, setIndex] = useState(0);
  const [brandImageUrl, setBrandImageUrl] = useState('');
  const [cardDimensions, setCardDimensions] = useState({
    cardWidth: 288,
    cardHeight: 384,
    desktopCardWidth: 288,
    desktopCardHeight: 384,
  });

  useEffect(() => {
    const targetDate = new Date('2025-02-23T11:30:00Z');

    const updateTimer = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('SCENE AVAILABLE NOW');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`NEXT SCENE IN ${days}D ${hours}H ${minutes}M ${seconds}S`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const { data } = supabase.storage.from('app_assets').getPublicUrl('vokal-brand.webp');
    setBrandImageUrl(data.publicUrl);
  }, []);

  useEffect(() => {
    const desktopCardWidth = 340;
    const desktopCardHeight = 460;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const idealWidth = screenWidth - 40;
    const idealHeight = screenHeight * 0.8;
    const aspectRatio = 9 / 16;
    const heightFromWidth = idealWidth / aspectRatio;
    const cardHeight = Math.max(desktopCardHeight, Math.min(heightFromWidth, idealHeight));
    const cardWidth = cardHeight * aspectRatio;

    setCardDimensions({
      cardWidth,
      cardHeight,
      desktopCardWidth,
      desktopCardHeight,
    });
  }, []);

  useEffect(() => {
    mixpanel.track('Home Page Viewed', {
      user_logged_in: !!user,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleScenePress = useCallback(
    (scene: Scene) => {
      if (scene.isLocked) {
        mixpanel.track('Scene Locked Interaction', {
          scene_id: scene.id,
          scene_name: scene.title,
        });
        alert('This scene is currently locked.');
        return;
      }

      mixpanel.track('Scene Started', {
        scene_id: scene.id,
        scene_name: scene.title,
        user_logged_in: !!user,
      });

      const timestamp = Date.now();
      const roomPath = `/(home)/${scene.roomName}?t=${timestamp}`;

      if (Platform.OS === 'web') {
        const baseUrl = window.location.origin;
        const fullPath = `${baseUrl}${roomPath}`;
        window.location.href = fullPath;
      } else {
        router.push(roomPath);
      }
    },
    [user]
  );

  const handlePrivacyPress = useCallback(() => {
    if (Platform.OS === 'web') {
      window.open('https://meeno.com/privacy', '_blank');
    } else {
      router.push('/legal/privacy');
    }
  }, [router]);

  const handleTermsPress = useCallback(() => {
    if (Platform.OS === 'web') {
      window.open('https://meeno.com/terms', '_blank');
    } else {
      router.push('/legal/terms');
    }
  }, [router]);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        viewAreaCoveragePercentThreshold: 50,
      },
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
          setIndex(viewableItems[0].index);
        }
      },
    },
  ]);

  const handleShare = async () => {
    if (await Share.isAvailableAsync()) {
      try {
        await Share.shareAsync('https://be-vokal.com', {
          dialogTitle: 'Share Vokal',
          mimeType: 'text/plain',
          UTI: 'public.plain-text',
        });
        mixpanel.track('App Shared');
      } catch (error: unknown) {
        console.error(error);
        if (error instanceof Error) {
          mixpanel.track('Share Failed', { error: error.message });
        } else {
          mixpanel.track('Share Failed', { error: 'Unknown error occurred' });
        }
      }
    }
  };

  return (
    <View className="pt-safe flex flex-1 flex-col bg-white">
      {/* Header */}
      <View className="relative z-40 m-4">
        <View className="flex-row items-center justify-between pl-2 md:px-16 md:py-6">
          <ImageBackground
            source={{ uri: brandImageUrl }}
            className="h-[31px] w-[130px] justify-end"
            resizeMode="contain"></ImageBackground>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity onPress={handleShare}>
              <Ionicons
                name="paper-plane-outline"
                size={32}
                color="black"
                style={{ opacity: 0.2 }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDropdownVisible((prev) => !prev)}>
              <Ionicons
                name="person-circle-outline"
                size={36}
                color="black"
                style={{ opacity: 0.2 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        {dropdownVisible && (
          <View className="absolute right-0 top-[3rem] z-50 rounded-md bg-white shadow-lg">
            {user && !isAnonymous ? (
              <TouchableOpacity
                className="flex-row items-center space-x-2 px-4 py-3"
                onPress={signOut}>
                <Ionicons name="log-out-outline" size={20} color="#374151" />
                <Text className="text-base font-medium text-gray-700">Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-row items-center space-x-2 px-4 py-3"
                onPress={() => setShowAuthModal(true)}>
                <Ionicons name="log-in-outline" size={20} color="#374151" />
                <Text className="text-base font-medium text-gray-700">Login</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Main Content */}
      <View className="pb-safe flex-1">
        {/* Mobile Carousel */}
        <View className="w-full md:hidden">
          <FlatList
            className="pt-2"
            horizontal
            showsHorizontalScrollIndicator={false}
            data={mockScenes}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 6,
            }}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VokalSceneCard
                key={item.id}
                scene={item}
                onPress={() => handleScenePress(item)}
                cardWidth={cardDimensions.cardWidth}
                cardHeight={cardDimensions.cardHeight}
              />
            )}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
            })}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          />
          {/* Page Indicator */}
          <View className="flex-row items-center justify-center">
            {mockScenes.map((_, i) => (
              <View
                key={i}
                className={`mx-1 h-2 w-2 rounded-full transition-all ${
                  i === index ? 'w-4 bg-gray-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>
          <View className="mt-2 items-center justify-center">
            <Text className="text-sm font-bold text-gray-500">{timeLeft}</Text>
          </View>
        </View>

        {/* Desktop Grid */}
        <View className="pb-safe hidden scroll-p-4 overflow-auto md:flex md:flex-1">
          <View className="mx-auto w-full max-w-[960px] p-0 lg:max-w-[1440px]">
            <View className="grid grid-cols-2 place-items-center gap-6 px-4 pt-4 sm:px-0 lg:grid-cols-3">
              {mockScenes.map((scene) => (
                <VokalSceneCard
                  key={scene.id}
                  scene={scene}
                  onPress={() => handleScenePress(scene)}
                  cardWidth={cardDimensions.desktopCardWidth}
                  cardHeight={cardDimensions.desktopCardHeight}
                />
              ))}
            </View>
          </View>
          <View className="items-center justify-center py-4">
            <Text className="text-lg text-gray-500">{timeLeft}</Text>
          </View>
        </View>
      </View>

      {/* Create Room Button */}
      <CreateRoomButton />

      {/* Footer - Added safe padding to account for Safari's bottom bar */}
      <View className="pb-safe bg-transparent p-1 md:px-16">
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] text-gray-400">© 2025 Vokal</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity onPress={handlePrivacyPress}>
              <Text className="text-[10px] text-gray-400">Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTermsPress}>
              <Text className="text-[10px] text-gray-400">Terms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
}
