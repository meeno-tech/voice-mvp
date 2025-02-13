import { useColorScheme } from "hooks/useColorScheme";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabBarBackground() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";

  return (
    <BlurView
      tint="light"
      intensity={95}
      style={[
        styles.container,
        {
          height: 49 + insets.bottom,
          borderTopColor: "rgba(0,0,0,0.1)",
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
});
