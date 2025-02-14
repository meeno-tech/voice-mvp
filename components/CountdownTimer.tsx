import { ThemedText } from 'components/ThemedText';
import { Colors } from 'constants/Colors';
import { useColorScheme } from 'hooks/useColorScheme';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface CountdownTimerProps {
  duration?: number;
}

export function CountdownTimer({ duration = 240 }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const getTimerColor = () => {
    if (timeLeft <= 30) return Colors[theme].error;
    if (timeLeft <= 60) return Colors[theme].warning;
    return Colors[theme].success;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.timerWrapper, { backgroundColor: getTimerColor() }]}>
        <ThemedText lightColor="#000000" darkColor="#000000">
          {`${minutes}:${seconds.toString().padStart(2, '0')}`}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
