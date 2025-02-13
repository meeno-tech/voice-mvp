// app/(tabs)/index.tsx
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { MediaDeviceFailure } from "livekit-client";
import React, { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CountdownTimer } from "components/CountdownTimer";
import PaywallModal from "components/PaywallModal";
import { ThemedText } from "components/ThemedText";
import { ThemedView } from "components/ThemedView";
import { SceneCard } from "components/scenes/SceneCard";
import { IconSymbol } from "components/ui/IconSymbol";
import { Colors } from "constants/Colors";
import { useColorScheme } from "hooks/useColorScheme";
import { Scene, mockScenes } from "types/scenes";

export default function ScenesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";

  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    token: string;
  } | null>(null);

  // Calculate the number of columns based on screen width
  const numColumns = Platform.select({
    web: Math.max(2, Math.floor(width / 400)),
    default: 2,
  });

  const handleScenePress = useCallback(async (scene: Scene) => {
    setActiveScene(scene);

    if (scene.isLocked) {
      if (Platform.OS === "web") {
        setShowPaywall(true);
      } else {
        alert(
          "This scene is currently locked. Please use the web version to unlock premium content."
        );
      }
      return;
    }

    await connectToScene(scene);
  }, []);

  const connectToScene = async (scene: Scene) => {
    try {
      const response = await fetch(
        `https://cloud-api.livekit.io/api/sandbox/connection-details?roomName=${encodeURIComponent(
          scene.roomName
        )}&participantName=user_${Math.floor(Math.random() * 100000)}`,
        {
          method: "POST",
          headers: {
            "X-Sandbox-ID": "interactive-sensor-22a69a",
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setConnectionDetails({
        serverUrl: data.serverUrl,
        token: data.participantToken,
      });
    } catch (error) {
      console.error("Failed to connect to LiveKit:", error);
    }
  };

  const handlePaywallContinue = useCallback(() => {
    setShowPaywall(false);

    // TODO: To implement actual unlocking:
    // 1. Integrate with your payment processing system
    // 2. After successful payment, update the user's subscription status in Supabase
    // 3. Update the local state/cache to reflect unlocked content
    // 4. Consider adding a proper subscription management system
    // 5. You might want to store unlocked status in Supabase and sync across devices

    // For now, just close the paywall and keep the scene locked
    if (activeScene) {
      alert("This scene will be available in the full version!");
    }
  }, [activeScene]);

  const handleDisconnect = useCallback(() => {
    setActiveScene(null);
    setConnectionDetails(null);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          padding: Platform.OS === "web" ? 8 : 16,
          paddingTop: insets.top + (Platform.OS === "web" ? 40 : 20),
          paddingBottom: insets.bottom + 20,
        }}
      >
        <ThemedText type="title" style={styles.title}>
          Scenery
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Where would you love to meet someone new?
        </ThemedText>

        <View style={styles.gridContainer}>
          {mockScenes.map((scene, index) => (
            <View
              key={scene.id}
              style={[
                styles.cardWrapper,
                {
                  width: `${100 / numColumns}%`,
                  transform:
                    Platform.OS !== "web"
                      ? [{ translateY: index % 2 === 0 ? 0 : 20 }]
                      : undefined,
                },
              ]}
            >
              <SceneCard scene={scene} onPress={handleScenePress} />
            </View>
          ))}
        </View>
      </ScrollView>

      {connectionDetails && activeScene && (
        <View
          style={[
            styles.roomOverlay,
            { backgroundColor: Colors[theme].background },
          ]}
        >
          <View style={styles.roomContainer}>
            <CountdownTimer duration={240} />
            <LiveKitRoom
              token={connectionDetails.token}
              serverUrl={connectionDetails.serverUrl}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={handleDisconnect}
              onMediaDeviceFailure={onMediaDeviceFailure}
            >
              <View style={styles.roomContent}>
                <ThemedText type="title" style={styles.roomTitle}>
                  {activeScene.title}
                </ThemedText>
                <ThemedText style={styles.roomDescription}>
                  {activeScene.description}
                </ThemedText>
                <TouchableOpacity
                  onPress={handleDisconnect}
                  style={styles.stopButton}
                >
                  <IconSymbol
                    name="xmark.circle.fill"
                    size={28}
                    color="#FFFFFF"
                  />
                  <ThemedText
                    style={styles.stopButtonText}
                    lightColor="#00000"
                    darkColor="#00000"
                  >
                    End Scene
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <RoomAudioRenderer />
            </LiveKitRoom>
          </View>
        </View>
      )}

      {Platform.OS === "web" && showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onContinue={handlePaywallContinue}
        />
      )}
    </ThemedView>
  );
}

function onMediaDeviceFailure(error?: MediaDeviceFailure) {
  console.error("Media device failure:", error);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 72,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: Platform.select({ web: 48, default: 32 }),
    marginBottom: Platform.select({ web: 14, default: 16 }),
    textAlign: "center",
    fontWeight: "600",
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: Platform.select({ web: 20, default: 16 }),
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
    maxWidth: "75%",
    alignSelf: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: -8,
    maxWidth: 1200,
    alignSelf: "center",
  },
  cardWrapper: {
    padding: 8,
  },
  roomOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1000,
  },
  roomContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  roomContent: {
    width: "100%",
    maxWidth: 600,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    flex: 1,
    paddingVertical: 20,
    gap: 20
  },
  roomTitle: {
    fontSize: Platform.select({ web: 36, default: 28 }),
    textAlign: "center"
  },
  roomDescription: {
    maxWidth: "70%",
    fontSize: Platform.select({ web: 18, default: 16 }),
    textAlign: "center",
    opacity: 0.8
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff6883",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});