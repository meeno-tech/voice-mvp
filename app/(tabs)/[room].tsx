import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { CallExperience } from 'components/CallExperience';
import { CountdownTimer } from 'components/CountdownTimer';
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useColorScheme } from 'hooks/useColorScheme';
import { Room } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scene, mockScenes } from 'types/scenes';
import { generateUniqueRoomName, getBaseRoomName } from 'utils/roomUtils';

export default function RoomScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
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

  // Force component remounting on navigation
  useEffect(() => {
    // This will force the component to remount
    // by setting a unique key based on the timestamp

    // NOTE: Why do this? Because the /lk-token endpoint wasn't firing and
    // we need to get this working asap

    // TODO: Remove this workaround.
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
        // Generate unique room name for this instance
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
        <CountdownTimer duration={240} />
        <CallExperience />
        <View style={styles.sceneInfo}>
          <ThemedText type="title" style={styles.title}>
            {scene?.title}
          </ThemedText>
          <ThemedText style={styles.description}>{scene?.description}</ThemedText>
        </View>
      </View>
    );
  };

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
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Platform.select({ web: 20, default: 10 }) },
        ]}>
        <TouchableOpacity onPress={handleDisconnect} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={Colors[theme].text} />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </TouchableOpacity>
      </View>

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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 1,
  },
  sceneInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'web' ? 40 : 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.light.text,
  },
  description: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 600,
    marginBottom: 12,
    color: Colors.light.text,
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
});
