import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Platform,
  FlatList,
  Animated,
  ViewToken,
  Dimensions,
} from 'react-native';
import VokalSceneCard from 'components/scenes/VokalSceneCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Scene, mockScenes } from 'types/scenes';
import { AuthModal } from 'components/auth/AuthModal';
import { useAuth } from 'contexts/AuthContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

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

  // Add scenes from mockScenes
  const scenes = mockScenes;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const maxHeight = screenHeight - 250;
  const maxWidth = screenWidth - 64;
  // Calculate dimensions maintaining 9:16 ratio
  const aspectRatio = 9 / 16;
  const heightFromWidth = maxWidth / aspectRatio;
  const widthFromHeight = maxHeight * aspectRatio;
  // Choose the smaller dimension that maintains ratio
  const cardWidth = Math.min(maxWidth, widthFromHeight);
  const cardHeight = Math.min(maxHeight, heightFromWidth);

  const handleScenePress = useCallback((scene: Scene) => {
    if (scene.isLocked) {
      alert('This scene is currently locked.');
    }

    // Add timestamp to force component refresh on navigation
    // TODO: Remove this workaround...it's just a quick fix for 2/18...famous last words
    const timestamp = Date.now();
    const roomPath = `/(home)/${scene.roomName.toLowerCase()}?t=${timestamp}`;

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

  const handleLogin = useCallback(() => {
    setDropdownVisible(false);
    setShowAuthModal(true);
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      setDropdownVisible(false);
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to log out. Please try again.');
    }
  }, [signOut, router]);

  useEffect(() => {
    const targetDate = new Date('2025-02-23T11:30:00Z'); // 5PM IST = 11:30 UTC

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

    // Update immediately and then every second
    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View className="flex min-h-screen flex-1 flex-col bg-white">
      {/* Header */}
      <View className="relative z-50">
        <View className="flex-row items-center justify-between px-8 py-4 md:px-16 md:py-4">
          <Text className="font-sans text-5xl font-bold text-black">Vokal</Text>
          <TouchableOpacity onPress={() => setDropdownVisible((prev) => !prev)}>
            <Ionicons
              name="person-circle-outline"
              size={44}
              color="black"
              style={{ opacity: 0.2 }}
            />
          </TouchableOpacity>
        </View>
        {dropdownVisible && (
          <View className="absolute right-4 top-[4.5rem] rounded-md bg-white shadow-lg">
            {user ? (
              <TouchableOpacity
                className="flex-row items-center space-x-2 px-4 py-3"
                onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#374151" />
                <Text className="text-base font-medium text-gray-700">Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-row items-center space-x-2 px-4 py-3"
                onPress={handleLogin}>
                <Ionicons name="log-in-outline" size={20} color="#374151" />
                <Text className="text-base font-medium text-gray-700">Login</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="w-full md:hidden">
          <FlatList
            className="py-4"
            horizontal
            showsHorizontalScrollIndicator={Platform.OS === 'web'}
            data={scenes}
            contentContainerStyle={{
              paddingHorizontal: 32,
            }}
            ItemSeparatorComponent={() => <View style={{ width: 24 }} />}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VokalSceneCard
                key={item.id}
                scene={item}
                onPress={() => handleScenePress(item)}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
              />
            )}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
            })}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          />
          {/* Page Indicator */}
          <View className="flex-row items-center justify-center py-4">
            {scenes.map((_, i) => (
              <View
                key={i}
                className={`mx-1 h-2 w-2 rounded-full transition-all ${
                  i === index ? 'w-4 bg-black' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Grid layout for md and above */}
        <View className="hidden scroll-p-4 overflow-auto md:flex md:flex-1">
          <View className="mx-auto w-full max-w-[672px] p-0 lg:max-w-[1008px]">
            <View className="grid grid-cols-2 gap-8 px-4 sm:px-0 lg:grid-cols-3">
              {scenes.map((scene) => (
                <VokalSceneCard
                  key={scene.id}
                  scene={scene}
                  onPress={() => handleScenePress(scene)}
                  cardWidth={320}
                  cardHeight={500}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Next Scene Countdown - shown below both mobile and desktop layouts */}
      <View className="items-center justify-center py-6">
        <Text className="text-lg font-medium text-gray-500">{timeLeft}</Text>
      </View>

      {/* Footer */}
      <View className="flex h-[60px] justify-center border-t border-gray-100 bg-white px-6 md:px-16">
        <View className="flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <Text className="text-center text-xs font-normal text-gray-500 md:text-left">
            © 2024 Vokal. All rights reserved.
          </Text>
          <View className="flex-row justify-center space-x-4">
            <TouchableOpacity>
              <Text className="text-xs font-normal text-gray-500 active:text-gray-600">
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="text-xs font-normal text-gray-500 active:text-gray-600">
                Terms of Service
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
}
