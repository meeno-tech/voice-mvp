import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "components/ThemedText";
import { ThemedView } from "components/ThemedView";
import { ShareSection } from "components/explore/ShareSheet";
import { TestimonialSection } from "components/explore/TestimonialSection";

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 40 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 40 : 20),
          } as ViewStyle,
        ]}
      >
        <View style={styles.contentWrapper}>
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.headerContainer}
          >
            <ThemedText type="title" style={styles.title}>
              Share the Love
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Send to a friend that thinks love is the best
            </ThemedText>
          </Animated.View>

          <TestimonialSection />
          <ShareSection />
          {/* <StatsCard /> */}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  contentWrapper: {
    maxWidth: Platform.OS === "web" ? 800 : undefined,
    width: "100%",
    alignSelf: "center",
  } as ViewStyle,
  scrollContent: {
    padding: Platform.OS === "web" ? 0 : 20,
  } as ViewStyle,
  headerContainer: {
    marginBottom: Platform.OS === "web" ? 24 : 32,
    alignItems: "center",
  } as ViewStyle,
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: Platform.OS === "web" ? 36 : 32,
    fontWeight: "600",
  } as TextStyle,
  subtitle: {
    textAlign: "center",
    fontSize: Platform.OS === "web" ? 20 : 18,
    opacity: 0.8,
    maxWidth: 500,
    marginHorizontal: "auto",
  } as TextStyle,
});
