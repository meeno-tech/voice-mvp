import { useColorScheme } from "hooks/useColorScheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabBarBackground() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";

  return (
    <View
      style={[
        styles.container,
        {
          height: 70 + insets.bottom,
          backgroundColor: "#ffffff",
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
    borderTopWidth: 1,
    boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
  },
});
