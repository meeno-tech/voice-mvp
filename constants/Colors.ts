import { Platform } from "react-native";

// Modern tech-focused colors
const primary = "#000000"; // Pure black for primary actions
const secondary = "#333333"; // Darker grey for secondary elements
const accent = "#666666"; // Medium grey for accents

type ColorScheme = {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  surfaceElement: string;
  buttonText: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  tabBar: {
    background: string;
    border: string;
    shadow: string;
  };
};

export const Colors: { light: ColorScheme; dark: ColorScheme } = {
  light: {
    text: "#000000", // Pure black for text
    background: "#ffffff", // Pure white background
    tint: primary, // Black for interactive elements
    icon: "#666666", // Medium grey for icons
    tabIconDefault: "#999999", // Light grey for unselected icons
    tabIconSelected: primary, // Black for selected tab
    surfaceElement: "#ffffff", // White for cards with shadow
    buttonText: "#ffffff", // White text for buttons
    border: "#f0f0f0", // Very light grey for borders
    success: "#9BE79B", // Pastel green
    error: "#FFB7B7", // Pastel red
    warning: "#FFE5B4", // Pastel yellow
    info: "#B4D5FF", // Pastel blue
    tabBar: {
      background: Platform.select({
        ios: "rgba(255,255,255,0.95)",
        default: "#ffffff",
      }),
      border: "rgba(0,0,0,0.1)",
      shadow: Platform.select({
        ios: "0 -1px 0 rgba(0,0,0,0.1)",
        android: "none",
        default: "0 -2px 8px rgba(0,0,0,0.1)",
      }),
    },
  },
  // Keep dark mode values but they won't be used since we're focusing on light mode
  dark: {
    text: "#000000",
    background: "#ffffff",
    tint: primary,
    icon: "#666666",
    tabIconDefault: "#999999",
    tabIconSelected: primary,
    surfaceElement: "#ffffff",
    buttonText: "#ffffff",
    border: "#f0f0f0",
    success: "#dfff9b",
    error: "#ff9bad",
    warning: "#ffed9b",
    info: "#B4D5FF",
    tabBar: {
      background: Platform.select({
        ios: "rgba(255,255,255,0.95)",
        default: "#ffffff",
      }),
      border: "rgba(0,0,0,0.1)",
      shadow: Platform.select({
        ios: "0 -1px 0 rgba(0,0,0,0.1)",
        android: "none",
        default: "0 -2px 8px rgba(0,0,0,0.1)",
      }),
    },
  },
};
