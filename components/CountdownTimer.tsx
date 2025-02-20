import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CountdownTimerProps {
  duration?: number;
}

export function CountdownTimer({ duration = 240 }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>
        {`${minutes}:${seconds.toString().padStart(2, '0')} LEFT`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    width: 116,
    height: 18,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '900',
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: 'rgba(60, 60, 67, 0.6)',
  },
});
