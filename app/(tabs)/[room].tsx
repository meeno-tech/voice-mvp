import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { CallExperience } from 'components/CallExperience';
import { CountdownTimer } from 'components/CountdownTimer';
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'hooks/useColorScheme';
import { MediaDeviceFailure } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scene, mockScenes } from 'types/scenes';

export default function RoomScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const [scene, setScene] = useState<Scene | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    token: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        connectToScene(foundScene);
      } else {
        setError('Scene not found');
        router.back();
      }
    };

    initializeRoom();
  }, [params.room]);

  const connectToScene = async (scene: Scene) => {
    try {
      setIsConnecting(true);
      setError(null);

      const response = await fetch(
        `https://cloud-api.livekit.io/api/sandbox/connection-details?roomName=${encodeURIComponent(
          scene.roomName
        )}&participantName=user_${Math.floor(Math.random() * 100000)}`,
        {
          method: 'POST',
          headers: {
            'X-Sandbox-ID': 'interactive-sensor-22a69a',
            'Content-Type': 'application/json',
          },
        }
      );

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

  const handleDisconnect = () => {
    setConnectionDetails(null);
    router.back();
  };

  const handleRoomError = (error: Error) => {
    console.error('Room error:', error);
    setError(error.message);
  };

  if (!scene) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={['#007AFF', 'rgba(0, 122, 255, 0)']}
          style={StyleSheet.absoluteFill}
          locations={[0, 1]}
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
        colors={['#007AFF', 'rgba(0, 122, 255, 0)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 1]}
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
          onConnected={() => console.log('Connected to room')}
          onMediaDeviceFailure={onMediaDeviceFailure}>
          <View style={styles.content}>
            <CountdownTimer duration={240} />
            <CallExperience />
            <View style={styles.sceneInfo}>
              <ThemedText type="title" style={styles.title}>
                {scene.title}
              </ThemedText>
              <ThemedText style={styles.description}>{scene.description}</ThemedText>
            </View>
          </View>
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

function onMediaDeviceFailure(error?: MediaDeviceFailure) {
  console.error('Media device failure:', error);
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
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'capitalize',
    fontWeight: '600',
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
