import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { CallExperience } from 'components/CallExperience';
import { CountdownTimer } from 'components/CountdownTimer';
import { SceneInstructions } from 'components/scenes/SceneInstructions';
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { Colors } from 'constants/Colors';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Room } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Scene, mockScenes } from 'types/scenes';
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
    } catch (error) {
      console.error('Failed to connect to LiveKit:', error);
      setError('Failed to connect to room');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await cleanupRoom();
      setConnectionDetails(null);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error during disconnect:', error);
      router.replace('/(tabs)');
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
      <View style={styles.content}>
        <View style={styles.topContainer}>
          <ThemedText type="title" style={styles.title}>
            {scene?.title}
          </ThemedText>
          <View style={styles.timerContainer}>
            <CountdownTimer duration={180} />
          </View>
          <View style={styles.speechContainer}>
            <CallExperience />
          </View>
          <View style={styles.instructionsContainer}>
            {scene && <SceneInstructions scene={scene} />}
          </View>
        </View>
      </View>
    );
  };

  const ExitButton = () => (
    <TouchableOpacity style={styles.exitButton} onPress={handleDisconnect}>
      <ThemedText style={styles.exitX} lightColor="#FFFFFF" darkColor="#FFFFFF">
        ✕
      </ThemedText>
    </TouchableOpacity>
  );

  if (!scene) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={['rgba(255, 127, 127, 0.3)', 'rgba(255, 127, 127, 0.05)']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.9]}
        />
        <View style={styles.loading}>
          <ThemedText>{error || 'Loading scene...'}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 127, 127, 0.3)', 'rgba(255, 127, 127, 0.05)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.9]}
      />

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
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
        <View style={styles.loading}>
          <ThemedText>{isConnecting ? 'Connecting to scene...' : 'Initializing...'}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.select({ web: 40, default: 20 }),
    zIndex: 1,
  },
  topContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: Platform.select({ web: 32, default: 28 }),
  },
  timerContainer: {
    marginBottom: 12,
  },
  speechContainer: {
    marginBottom: 16,
  },
  instructionsContainer: {
    width: '100%',
    paddingHorizontal: Platform.select({ web: 24, default: 16 }),
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: Colors.light.error,
    marginHorizontal: 20,
    borderRadius: 8,
    zIndex: 1,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  exitButton: {
    position: 'absolute',
    bottom: Platform.select({ web: 40, default: 30 }),
    left: '50%',
    transform: Platform.select({
      web: [{ translateX: -35 }],
      default: [{ translateX: -35 }],
    }),
    width: 52,
    height: 64,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  exitX: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});
