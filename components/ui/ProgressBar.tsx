import { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const progressAnim = useRef(new Animated.Value(currentStep)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        if (step < currentStep) {
          return (
            <View key={step} style={[styles.progressBar, { backgroundColor: Colors.dark.tint }]} />
          );
        }

        if (step === currentStep) {
          const animatedBackgroundColor = progressAnim.interpolate({
            inputRange: [step - 1, step],
            outputRange: [Colors.dark.surfaceElement, Colors.dark.tint],
          });

          return (
            <Animated.View
              key={step}
              style={[styles.progressBar, { backgroundColor: animatedBackgroundColor }]}
            />
          );
        }

        return (
          <View
            key={step}
            style={[styles.progressBar, { backgroundColor: Colors.dark.surfaceElement }]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});

export default ProgressBar;
