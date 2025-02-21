import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from 'contexts/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

Sentry.init({
  dsn: 'https://aabcd97fc09b372eedba3c04f1a84d49@o4508814661976064.ingest.us.sentry.io/4508814663811072',
  debug: true,
});

function RootLayout() {
  useFonts({
    BarlowCondensed: require('../assets/fonts/BarlowCondensed-Regular.ttf'),
    Inter: require('../assets/fonts/Inter-V.ttf'),
  });

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
