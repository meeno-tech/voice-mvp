import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { CallExperience } from 'components/CallExperience';
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { WaveVisualizer } from 'components/WaveVisualizer';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Room } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Scene, mockScenes } from 'types/scenes';
import { mixpanel } from 'utils/mixpanel';
import { generateUniqueRoomName, getBaseRoomName } from 'utils/roomUtils';

export default function DemoScreen() {
  const router = useRouter();
  const roomRef = useRef<Room | null>(null);
  const cleanupInProgressRef = useRef(false);

  const [scene, setScene] = useState<Scene | null>(null);
  const [uniqueRoomName, setUniqueRoomName] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    token: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          title: 'Physics with Donald Duck',
          description:
            'Learn about physics from Professor Donald Duck in this cold reading experience.',
          roomName: 'cold-reading-physics',
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
      await cleanupRoom();
      setConnectionDetails(null);
      router.replace('/(home)');
    } catch (error) {
      console.error('Error during disconnect:', error);
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
          <ThemedText
            type="title"
            className="mb-10 w-full text-center text-xl font-bold text-gray-800 md:text-3xl"
            style={{ fontFamily: 'DelaGothicOne', lineHeight: 46 }}>
            Let&apos;s find your personality
          </ThemedText>
          <View className="mb-8">
            <CallExperience />
          </View>
          <View className="mb-4 w-full">
            <View className="h-32">
              <WaveVisualizer height={120} waveColor="rgba(100, 100, 255, 0.7)" pointCount={16} />
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
        className="text-center text-2xl font-bold text-white"
        lightColor="#FFFFFF"
        darkColor="#FFFFFF">
        ✕
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView className="flex-1">
      <LinearGradient
        colors={['#E7DFE2', '#E7DFE2', '#FD4C18']}
        className="absolute inset-0"
        locations={[0, 0.6, 1]}
      />

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
          onDisconnected={handleDisconnect}
          onError={handleRoomError}
          onConnected={() => console.log('Connected to demo room:', uniqueRoomName)}>
          <RoomContent />
          <RoomAudioRenderer />
          <ExitButton />
        </LiveKitRoom>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ThemedText>{isConnecting ? 'Connecting to demo...' : 'Initializing...'}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}
