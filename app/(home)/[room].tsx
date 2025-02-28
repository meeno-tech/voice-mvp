import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { CallExperience } from 'components/CallExperience';
import { CountdownTimer } from 'components/CountdownTimer';
import { SceneInstructions } from 'components/scenes/SceneInstructions';
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Room } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Scene, mockScenes } from 'types/scenes';
import { mixpanel } from 'utils/mixpanel';
import { generateUniqueRoomName, getBaseRoomName } from 'utils/roomUtils';

export default function RoomScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomRef = useRef<Room | null>(null);
  const cleanupInProgressRef = useRef(false);
  const mountedRef = useRef(false);

  const [scene, setScene] = useState<Scene | null>(null);
  const [uniqueRoomName, setUniqueRoomName] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    token: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mountedRef.current) {
      const timestamp = Date.now();
      router.replace(`${pathname}?t=${timestamp}`);
    } else {
      mountedRef.current = true;
    }
  }, [pathname]);

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

    const initializeRoom = async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      const foundScene = mockScenes.find(
        (s) => s.roomName.toLowerCase() === params.room?.toString().toLowerCase()
      );

      if (foundScene) {
        setScene(foundScene);
        const uniqueRoomId = generateUniqueRoomName(foundScene.roomName);
        setUniqueRoomName(uniqueRoomId);
        console.log('Generated unique room:', {
          baseRoomName: getBaseRoomName(uniqueRoomId),
          uniqueRoomId,
        });
        connectToScene(foundScene, uniqueRoomId);
      } else {
        setError('Scene not found');
        router.back();
      }
    };

    initializeRoom();
  }, [params.room]);

  const connectToScene = async (scene: Scene, uniqueRoomId: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      mixpanel.track('Scene Connection Started', {
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

      const response = await fetch(`${apiUrl}/lk-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene_name: uniqueRoomId,
          participant_name: `user_${Math.floor(Math.random() * 100000)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get connection details');
      }

      const data = await response.json();

      setConnectionDetails({
        serverUrl: data.serverUrl,
        token: data.participantToken,
      });

      mixpanel.track('Scene Connection Successful', {
        scene_id: scene.id,
        scene_name: scene.title,
        room_id: uniqueRoomId,
      });
    } catch (error: unknown) {
      console.error('Failed to connect to LiveKit:', error);
      mixpanel.track('Scene Connection Failed', {
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
      mixpanel.track('Scene Disconnected', {
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
      <View className="z-1 flex-1 items-center pt-10 md:pt-16">
        <View className="w-full items-center">
          <ThemedText
            type="title"
            className="mb-3.5 w-4/5 text-center text-2xl font-semibold uppercase text-black md:text-4xl"
            style={{ fontFamily: 'DelaGothicOne' }}>
            {scene?.title}
          </ThemedText>
          <View className="mb-6">
            <CountdownTimer duration={180} />
          </View>
          <View className="mb-4">
            <CallExperience />
          </View>
          <View className="w-full">{scene && <SceneInstructions scene={scene} />}</View>
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

  if (!scene) {
    return (
      <ThemedView className="flex-1">
        <LinearGradient
          colors={['#E7DFE2', '#E7DFE2', '#FD4C18']}
          className="absolute inset-0"
          locations={[0, 0.6, 1]}
        />
        <View className="flex-1 items-center justify-center">
          <ThemedText>{error || 'Loading scene...'}</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
          onConnected={() => console.log('Connected to room:', uniqueRoomName)}>
          <RoomContent />
          <RoomAudioRenderer />
          <ExitButton />
        </LiveKitRoom>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ThemedText>{isConnecting ? 'Connecting to scene...' : 'Initializing...'}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}
