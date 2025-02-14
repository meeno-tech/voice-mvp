import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { useColorScheme } from 'hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface LegalViewerProps {
  type: 'privacy' | 'terms';
}

export function LegalViewer({ type }: LegalViewerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const url = type === 'privacy' ? 'https://meeno.com/privacy' : 'https://meeno.com/terms';
  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  const handleBack = () => {
    router.back();
  };

  if (Platform.OS === 'web') {
    // For web, open in a new tab
    // window.open(url, "_blank");
    router.back();
    return null;
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={Colors[theme].text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>
      <WebView source={{ uri: url }} style={styles.webview} startInLoadingState={true} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  webview: {
    flex: 1,
  },
});

export default LegalViewer;
