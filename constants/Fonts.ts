// constants/Fonts.ts
import { Platform } from 'react-native';

export const Fonts = {
  system: Platform.select({
    web: 'BarlowCondensed, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
    ios: '-apple-system',
    default: 'Roboto',
  }),
  heading: 'BarlowCondensed',
  body: Platform.select({
    web: 'BarlowCondensed, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
    ios: '-apple-system',
    default: 'Roboto',
  }),
  weights: {
    regular: '500',
    normal: '500',
    medium: '600',
    semibold: '700',
    bold: '700',
  },
} as const;
