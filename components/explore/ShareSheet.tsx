import * as Haptics from 'expo-haptics';
import {
  Clipboard,
  Platform,
  Share,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { useColorScheme } from 'hooks/useColorScheme';

interface ShareOption {
  id: string;
  title: string;
  icon: string;
  action: () => Promise<void>;
  color: string;
}

export function ShareSection() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const handleShare = async (customMessage?: string) => {
    const message = customMessage || 'Check out this awesome relationship learning app! 💝';
    const url = 'https://yourapp.com';

    try {
      await Share.share({
        message: `${message}\n${url}`,
        url,
      });
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyToClipboard = async () => {
    Clipboard.setString('https://yourapp.com');
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'message',
      title: 'Message',
      icon: 'paperplane.fill',
      color: Colors[theme].success,
      action: () => handleShare('Hey! 👋 Found this awesome app for improving relationship skills'),
    },
    {
      id: 'twitter',
      title: 'Twitter',
      icon: 'arrow.up.forward.circle.fill',
      color: Colors[theme].info,
      action: () => handleShare('Learning relationship skills with this amazing app! 🚀'),
    },
    {
      id: 'reddit',
      title: 'Reddit',
      icon: 'arrow.up.circle.fill',
      color: Colors[theme].warning,
      action: () => handleShare('Game-changing relationship learning app 🎯'),
    },
    {
      id: 'copy',
      title: 'Copy Link',
      icon: 'doc.on.doc.fill',
      color: Colors[theme].info,
      action: copyToClipboard,
    },
  ];

  return (
    <View style={styles.shareOptionsContainer}>
      {shareOptions.map((option, index) => (
        <Animated.View key={option.id} entering={FadeInUp.delay(300 + index * 100).springify()}>
          <TouchableOpacity
            style={styles.shareOption}
            onPress={async () => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              await option.action();
            }}>
            <ThemedView
              style={[styles.iconContainer, { backgroundColor: option.color } as ViewStyle]}>
              <IconSymbol
                name="paperplane.fill"
                size={Platform.OS === 'web' ? 28 : 24}
                color="#FFFFFF"
              />
            </ThemedView>
            <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shareOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Platform.OS === 'web' ? 24 : 16,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 0,
  } as ViewStyle,
  shareOption: {
    alignItems: 'center',
    width: Platform.OS === 'web' ? 120 : Platform.OS === 'ios' ? 80 : 90,
  } as ViewStyle,
  iconContainer: {
    width: Platform.OS === 'web' ? 64 : 56,
    height: Platform.OS === 'web' ? 64 : 56,
    borderRadius: Platform.OS === 'web' ? 32 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }
      : Platform.OS === 'android'
        ? { elevation: 4 }
        : {}),
  } as ViewStyle,
  optionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    textAlign: 'center',
  } as TextStyle,
});
