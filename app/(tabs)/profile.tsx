// app/(tabs)/profile.tsx
import { ThemedText } from "components/ThemedText";
import { ThemedView } from "components/ThemedView";
import { IconSymbol } from "components/ui/IconSymbol";
import { Colors } from "constants/Colors";
import { useAuth } from "contexts/AuthContext";
import { useColorScheme } from "hooks/useColorScheme";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ProfileOptionProps {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  label: string;
  onPress?: () => void;
  comingSoon?: boolean;
}

function ProfileOption({
  icon,
  label,
  onPress,
  comingSoon,
}: ProfileOptionProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";

  return (
    <TouchableOpacity
      style={[
        styles.option,
        {
          opacity: comingSoon ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
      disabled={comingSoon}
    >
      <View style={styles.optionContent}>
        <IconSymbol name={icon} size={20} color={Colors[theme].text} />
        <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      </View>
      {comingSoon ? (
        <ThemedText style={styles.comingSoon}>Coming Soon</ThemedText>
      ) : (
        <IconSymbol
          name="chevron.right"
          size={20}
          color={Colors[theme].tabIconDefault}
        />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";

  const handlePrivacyPress = () => {
    if (Platform.OS === "web") {
      window.open("https://meeno.com/privacy", "_blank");
    } else {
      router.push("/legal/privacy");
    }
  };

  const handleTermsPress = () => {
    if (Platform.OS === "web") {
      window.open("https://meeno.com/terms", "_blank");
    } else {
      router.push("/legal/terms");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.signInPrompt}>
          <ThemedText type="title" style={styles.signInTitle}>
            Sign In
          </ThemedText>
          <ThemedText style={styles.signInText}>
            Please sign in to access your profile and settings
          </ThemedText>
        </View>
        <View style={styles.legalLinksContainer}>
          <TouchableOpacity onPress={handlePrivacyPress}>
            <ThemedText style={styles.legalLink}>Privacy Policy</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.legalSeparator}>•</ThemedText>
          <TouchableOpacity onPress={handleTermsPress}>
            <ThemedText style={styles.legalLink}>Terms of Service</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View
              style={[styles.avatar, { backgroundColor: Colors[theme].tint }]}
            >
              <ThemedText
                style={styles.avatarText}
                lightColor="#FFFFFF"
                darkColor="#FFFFFF"
              >
                {user.email?.[0].toUpperCase() ?? "?"}
              </ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.email}>
              {user.email}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <ProfileOption
            icon="person.crop.circle"
            label="Edit Profile"
            comingSoon
          />
          <ProfileOption icon="bell" label="Notifications" comingSoon />
          <ProfileOption icon="lock" label="Privacy" comingSoon />
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            App
          </ThemedText>
          <ProfileOption icon="gear" label="Settings" comingSoon />
          <ProfileOption
            icon="questionmark.circle"
            label="Help & Support"
            comingSoon
          />
          <ProfileOption
            icon="shield"
            label="Privacy Policy"
            onPress={handlePrivacyPress}
          />
          <ProfileOption
            icon="doc.plaintext"
            label="Terms of Service"
            onPress={handleTermsPress}
          />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText
            style={styles.signOutText}
            lightColor={Colors.light.error}
            darkColor={Colors.dark.error}
          >
            Sign Out
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 62,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  email: {
    fontSize: 18,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    opacity: 0.6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(0, 0, 0, 0.02)",
      },
      android: {
        backgroundColor: "rgba(0, 0, 0, 0.02)",
      },
      web: {
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        cursor: "pointer",
        transition: "transform 0.2s ease",
        ":hover": {
          transform: "scale(1.02)",
        },
      },
    }),
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
  },
  comingSoon: {
    fontSize: 12,
    opacity: 0.5,
  },
  signOutButton: {
    marginBottom: 40,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  signInPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  signInTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  signInText: {
    textAlign: "center",
    opacity: 0.7,
    maxWidth: 300,
  },
  legalLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    gap: 8,
  },
  legalLink: {
    fontSize: 14,
    textDecorationLine: "underline",
    opacity: 0.7,
  },
  legalSeparator: {
    opacity: 0.5,
  },
});
