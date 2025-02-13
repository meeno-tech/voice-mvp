import { ThemedText } from "components/ThemedText";
import { useAuth } from "contexts/AuthContext";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthModal } from "./AuthModal";

export function AuthButton() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log("AuthButton: User state changed:", user?.email);
  }, [user]);

  // Don't render anything while loading
  if (loading) return null;

  // Don't render if user is logged in
  if (user) {
    console.log("AuthButton: User is logged in, not rendering button");
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          { top: Platform.OS === "web" ? 20 : insets.top + 8 },
        ]}
        onPress={() => setShowAuthModal(true)}
      >
        <ThemedText style={styles.buttonText}>Log In</ThemedText>
      </TouchableOpacity>

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: Platform.OS === "web" ? 24 : 16,
    zIndex: 100,
  },
  buttonText: {
    fontSize: 16,
    color: "#000000",
    fontStyle: "italic",
  },
});
