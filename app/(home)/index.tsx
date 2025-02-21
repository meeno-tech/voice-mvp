import { Ionicons } from '@expo/vector-icons';
import { AuthModal } from 'components/auth/AuthModal';
import VokalSceneCard from 'components/scenes/VokalSceneCard';
import { useAuth } from 'contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Scene, mockScenes } from 'types/scenes';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState('');

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

  const handleScenePress = useCallback((scene: Scene) => {
    if (scene.isLocked) {
      alert('This scene is currently locked.');
      return;
    }

    const timestamp = Date.now();
    const roomPath = `/(home)/${scene.roomName.toLowerCase()}?t=${timestamp}`;

    if (Platform.OS === 'web') {
      const baseUrl = window.location.origin;
      const fullPath = `${baseUrl}${roomPath}`;
      window.location.href = fullPath;
    } else {
      router.push(roomPath);
    }
  }, []);

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

  // Get window width for dynamic card sizing
  const windowWidth = Dimensions.get('window').width;

  // Mobile card sizing
  const mobilePadding = 28; // Total horizontal padding
  const cardWidthMobile = Math.min(319, windowWidth - mobilePadding);
  const cardHeightMobile = cardWidthMobile * (510 / 319);

  // Desktop card sizing - use the same 319px width as mobile but allow more cards
  const cardWidthDesktop = 319;
  const cardHeightDesktop = 510;

  const renderTimer = () => (
    <Text
      style={{
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '500',
        letterSpacing: 0.2,
        textAlign: 'center',
        color: '#999999',
        marginBottom: 16,
      }}>
      {timeLeft}
    </Text>
  );

  return (
    <View className="flex min-h-screen flex-1 flex-col bg-white">
      {/* Header */}
      <View className="relative z-50">
        <View className="flex-row items-center justify-between px-8 pt-4 md:px-16">
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
        {/* User dropdown menu */}
        {dropdownVisible && (
          <View className="absolute right-4 top-[4.5rem] rounded-md bg-white shadow-lg">
            {user ? (
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

      <View className="flex-1">
        {/* Mobile Layout */}
        <View className="w-full md:hidden">
          <FlatList
            className="py-2"
            horizontal
            showsHorizontalScrollIndicator={false}
            data={mockScenes}
            contentContainerStyle={{
              paddingHorizontal: 24,
            }}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VokalSceneCard
                key={item.id}
                scene={item}
                onPress={() => handleScenePress(item)}
                cardWidth={cardWidthMobile}
                cardHeight={cardHeightMobile}
              />
            )}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
            })}
          />
          {renderTimer()}
        </View>

        {/* Desktop Layout */}
        <View className="hidden scroll-p-4 overflow-auto md:flex md:flex-1">
          <View className="mx-auto w-full max-w-[800px] p-0 lg:max-w-[1200px]">
            <View className="grid grid-cols-2 px-4 sm:px-0 lg:grid-cols-3">
              {mockScenes.map((scene) => (
                <VokalSceneCard
                  key={scene.id}
                  scene={scene}
                  onPress={() => handleScenePress(scene)}
                  cardWidth={cardWidthDesktop}
                  cardHeight={cardHeightDesktop}
                />
              ))}
            </View>
            {renderTimer()}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="flex h-[40px] justify-center bg-transparent px-6 md:px-16">
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] text-gray-400">© 2024 Vokal</Text>
          <View className="flex-row space-x-4">
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
