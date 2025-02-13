import { Platform } from "react-native";

export const CHECKPOINT_SIZE = Platform.select({
  web: 52,
  ios: 56,
  default: 60,
});
export const PATH_WIDTH = Platform.select({ web: 5, ios: 6, default: 5 });
export const VERTICAL_SPACING = Platform.select({
  web: 260,
  ios: 280,
  default: 260,
}); // Increased web spacing
export const CONTENT_CARD_WIDTH = Platform.select({
  web: 200,
  ios: 200,
  default: 190,
});
export const VISIBLE_CHECKPOINTS = 2;
