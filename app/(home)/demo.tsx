import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { CallExperience } from 'components/CallExperience';
import { PostExperienceScreen } from 'components/PostExperienceScreen';
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { WaveVisualizer } from 'components/WaveVisualizer';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Room } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, TouchableOpacity, View } from 'react-native';
import { Scene, mockScenes } from 'types/scenes';
import { mixpanel } from 'utils/mixpanel';
import { generateUniqueRoomName, getBaseRoomName } from 'utils/roomUtils';
import { supabase } from 'utils/supabase';

export default function DemoScreen() {
  const router = useRouter();
  const roomRef = useRef<Room | null>(null);
  const cleanupInProgressRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [scene, setScene] = useState<Scene | null>(null);
  const [uniqueRoomName, setUniqueRoomName] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    token: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPostExperience, setShowPostExperience] = useState(false);
  const [brandImageUrl, setBrandImageUrl] = useState<string>('');

  const cleanupRoom = useCallback(async () => {
    if (cleanupInProgressRef.current || !roomRef.current) return;
    cleanupInProgressRef.current = true;

    try {
      const room = roomRef.current;
      console.log('Starting room cleanup...');
      await room.disconnect(true);
      roomRef.current = null;
      console.log('Room cleanup completed successfully');
    } catch (error) {
      console.error('Error during room cleanup:', error);
    } finally {
      cleanupInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupRoom();
    };
  }, [cleanupRoom]);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          setError('Microphone permission is required');
          return false;
        }
      }
      return true;
    };

    const initializeDemo = async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      // Find the cold reading scene
      const coldReadingScene = mockScenes.find((scene) => scene.simulationType === 'cold_reading');

      if (coldReadingScene) {
        setScene(coldReadingScene);
        const uniqueRoomId = generateUniqueRoomName(coldReadingScene.roomName);
        setUniqueRoomName(uniqueRoomId);
        console.log('Generated unique room for demo:', {
          baseRoomName: getBaseRoomName(uniqueRoomId),
          uniqueRoomId,
        });
        connectToScene(coldReadingScene, uniqueRoomId);
      } else {
        // Fallback: Create a temporary cold reading scene if not found in mockScenes
        console.log('Cold reading scene not found in mockScenes, creating a fallback');
        const fallbackScene: Scene = {
          id: 'cold-reading',
          title: 'Voice Analysis',
          description: 'Learn about yourself',
          roomName: 'voice-analysis',
          difficulty: 'beginner',
          category: 'social',
          simulationType: 'cold_reading',
        };

        setScene(fallbackScene);
        const uniqueRoomId = generateUniqueRoomName(fallbackScene.roomName);
        setUniqueRoomName(uniqueRoomId);
        connectToScene(fallbackScene, uniqueRoomId);
      }
    };

    // Automatically initialize the demo when the component mounts
    initializeDemo();
  }, []);

  useEffect(() => {
    // Load brand image
    const { data: brandData } = supabase.storage.from('app_assets').getPublicUrl('meeno_large.png');
    setBrandImageUrl(brandData.publicUrl);
  }, []);

  const connectToScene = async (scene: Scene, uniqueRoomId: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      mixpanel.track('Demo Connection Started', {
        scene_id: scene.id,
        scene_name: scene.title,
        room_id: uniqueRoomId,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const apiUrl = process.env.API_URL;
      if (!apiUrl) {
        throw new Error(
          'API_URL environment variable is not configured. Please check your .env file and ensure API_URL is set correctly.'
        );
      }

      interface TokenRequestBody {
        scene_name: string;
        participant_name: string;
        metadata?: string;
      }

      const requestBody: TokenRequestBody = {
        scene_name: uniqueRoomId,
        participant_name: `user_${Math.floor(Math.random() * 100000)}`,
      };

      // Add simulation type metadata - keep it simple
      requestBody.metadata = JSON.stringify({
        simulationType: 'cold_reading',
      });

      const response = await fetch(`${apiUrl}/lk-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to get connection details');
      }

      const data = await response.json();

      setConnectionDetails({
        serverUrl: data.serverUrl,
        token: data.participantToken,
      });

      mixpanel.track('Demo Connection Successful', {
        scene_id: scene.id,
        scene_name: scene.title,
        room_id: uniqueRoomId,
      });
    } catch (error: unknown) {
      console.error('Failed to connect to LiveKit:', error);
      mixpanel.track('Demo Connection Failed', {
        scene_id: scene.id,
        scene_name: scene.title,
        room_id: uniqueRoomId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setError('Failed to connect to room');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      mixpanel.track('Demo Disconnected', {
        scene_id: scene?.id ?? null,
        scene_name: scene?.title ?? null,
        room_id: uniqueRoomName,
      });

      // If the disconnect was initiated by the user (X button), go to home
      await cleanupRoom();
      setConnectionDetails(null);
      router.replace('/(home)');
    } catch (error) {
      console.error('Error during disconnect:', error);
      router.replace('/(home)');
    }
  };

  // Handle when the AI ends the call
  const handleAIEndedCall = async () => {
    try {
      // Start fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(async () => {
        // Clean up room after fade out
        await cleanupRoom();
        setConnectionDetails(null);

        // Show post-experience screen
        setShowPostExperience(true);

        // Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    } catch (error) {
      console.error('Error during AI call end transition:', error);
      router.replace('/(home)');
    }
  };

  const handleRoomError = (error: Error) => {
    console.error('Room error:', error);
    setError(error.message);
  };

  const RoomContent = () => {
    const room = useRoomContext();

    useEffect(() => {
      if (room) {
        roomRef.current = room;
      }
    }, [room]);

    return (
      <View className="z-1 flex-1 items-center justify-center">
        <View className="w-full items-center px-4 py-8 pt-16">
          {/* Logo */}
          <View className="items-center">
            <Image
              source={{ uri: brandImageUrl }}
              className="h-[50px] w-[200px]"
              resizeMode="contain"
              style={{ tintColor: 'white' }}
            />
          </View>

          {/* Heading */}
          <ThemedText
            className="mb-2 w-full pt-2 text-center font-semibold text-white"
            style={{
              fontSize: 20,
              letterSpacing: 0.3,
              color: '#FFFFFF',
            }}>
            Let&apos;s find your personality
          </ThemedText>

          {/* Subtitle
          <ThemedText
            className="max-w-[340px] text-center text-[16px] font-light text-white md:text-[17px]"
            style={{
              marginTop: responsivePadding.textMargin * 0.5,
              marginBottom: responsivePadding.textMargin * 1.5,
              color: '#FFFFFF',
            }}>
            To start your journey, it&apos;s best to use headphones or find a quiet spot.
          </ThemedText> */}

          <View className="mb-8">
            <CallExperience />
          </View>
          <View className="mb-4 w-full">
            <View className="relative flex h-32 items-center justify-center">
              <View className="absolute h-[80px] w-full max-w-[354px] overflow-hidden rounded-[24px] bg-black/10 backdrop-blur-[22px]">
                <View className="absolute flex h-full w-full items-center justify-center">
                  <WaveVisualizer height={40} waveColor="#FFFFFF" pointCount={16} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const ExitButton = () => (
    <TouchableOpacity
      className={`
        absolute bottom-8 left-1/2 h-16 w-[72px]
        -translate-x-[35px] items-center justify-center rounded-full 
        bg-black-12 md:bottom-10
        ${Platform.OS === 'web' ? 'cursor-pointer' : ''}
      `}
      onPress={handleDisconnect}>
      <ThemedText
        className="text-center font-bold text-white"
        lightColor="#FFFFFF"
        darkColor="#FFFFFF"
        style={{ fontSize: 26 }}>
        ✕
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView className="flex-1">
      {showPostExperience ? (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <PostExperienceScreen />
        </Animated.View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <View className="absolute inset-0 bg-[#0a9961]" />

          {error && (
            <View className="z-1 mx-5 rounded-lg bg-error px-4 py-4">
              <ThemedText className="text-center text-white">{error}</ThemedText>
            </View>
          )}

          {connectionDetails ? (
            <LiveKitRoom
              token={connectionDetails.token}
              serverUrl={connectionDetails.serverUrl}
              connect
              audio
              video={false}
              onDisconnected={handleAIEndedCall}
              onError={handleRoomError}
              onConnected={() => console.log('Connected to demo room:', uniqueRoomName)}>
              <RoomContent />
              <RoomAudioRenderer />
              <ExitButton />
            </LiveKitRoom>
          ) : (
            <View className="flex-1 items-center justify-center">
              <ThemedText className="text-white">
                {isConnecting ? 'Connecting to demo...' : 'Initializing...'}
              </ThemedText>
            </View>
          )}
        </Animated.View>
      )}
    </ThemedView>
  );
}
