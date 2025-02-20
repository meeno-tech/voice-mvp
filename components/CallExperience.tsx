import { useVoiceAssistant } from '@livekit/components-react';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface ParticipantCircleProps {
  label: string;
  isActive?: boolean;
  opacity?: number;
  isSpeaking?: boolean;
  isAI?: boolean;
}

const BAR_COUNT = 4;
const BASE_DURATION = 1600; // Slower for more natural wave
const MIN_HEIGHT = 14;
const MAX_HEIGHT = 54;
const CENTER_OFFSET = 27; // Half of MAX_HEIGHT to center the bars

// Use the built-in sine easing function for a smoother wave effect
const sineWaveEasing = Easing.inOut(Easing.sin);

const ParticipantCircle: React.FC<ParticipantCircleProps> = ({
  label,
  isActive = false,
  opacity = 1,
  isSpeaking = false,
  isAI = false,
}) => {
  const animationValues = useRef(
    Array(BAR_COUNT)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      const createSineWaveAnimation = (value: Animated.Value, index: number) => {
        // Create phase offset for each bar to create wave effect
        const phaseOffset = (index / BAR_COUNT) * Math.PI;
        const adjustedDuration = BASE_DURATION + phaseOffset * 100; // Adjust duration based on phase

        return Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: adjustedDuration,
            easing: (t) => {
              // Apply phase offset to create wave effect
              return sineWaveEasing(Math.sin(t * Math.PI + phaseOffset));
            },
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: adjustedDuration,
            easing: (t) => {
              // Apply phase offset to create wave effect
              return sineWaveEasing(Math.sin(t * Math.PI + phaseOffset));
            },
            useNativeDriver: false,
          }),
        ]);
      };

      // Create and start animations for each bar
      const animations = animationValues.map((value, index) => {
        const delay = index * (BASE_DURATION / BAR_COUNT / 2);
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(createSineWaveAnimation(value, index)),
        ]);
      });

      animations.forEach((anim) => anim.start());

      return () => {
        animations.forEach((anim) => anim.stop());
        animationValues.forEach((value) => value.setValue(0));
      };
    } else {
      // Reset to base state when not speaking
      animationValues.forEach((value) => {
        Animated.timing(value, {
          toValue: 0,
          duration: 400,
          easing: sineWaveEasing,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isSpeaking]);

  const getBarHeight = (index: number) => {
    return animationValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [MIN_HEIGHT, MAX_HEIGHT],
      extrapolate: 'clamp',
    });
  };

  const getBarOpacity = (index: number, isAI: boolean, animationValue: Animated.Value) => {
    // Define base opacities for AI and user
    const baseOpacities = isAI
      ? [0.15, 0.2, 0.5, 0.15] // AI base opacities
      : [0.5, 1, 0.5, 0.25]; // User base opacities

    // Interpolate the opacity to cycle through the bars
    return animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [baseOpacities[index], baseOpacities[(index + 1) % BAR_COUNT]],
      extrapolate: 'clamp',
    });
  };

  return (
    <View style={[styles.circleContainer, { opacity }]}>
      <View style={[styles.circle, !isActive && styles.circleInactive]}>
        <View style={styles.voiceBarsContainer}>
          {animationValues.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.voiceBar,
                {
                  height: getBarHeight(index),
                  opacity: getBarOpacity(index, isAI, animationValues[index]),
                  backgroundColor: isAI ? '#FF2D55' : '#007AFF',
                  transform: [{ translateY: -CENTER_OFFSET }], // Center the bars
                },
              ]}
            />
          ))}
        </View>
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  );
};

interface CallExperienceProps {
  onStateChange?: (state: string) => void;
}

export const CallExperience: React.FC<CallExperienceProps> = ({ onStateChange }) => {
  const { state } = useVoiceAssistant();
  const isAISpeaking = state === 'speaking';
  const isUserSpeaking = state === 'listening';

  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.participantsContainer}>
          <ParticipantCircle
            label="You"
            isActive={isUserSpeaking}
            opacity={state === 'disconnected' ? 0.25 : 1}
            isSpeaking={isUserSpeaking}
            isAI={false}
          />
          <ParticipantCircle
            label="AI"
            isActive={isAISpeaking}
            opacity={state === 'disconnected' ? 0.25 : 1}
            isSpeaking={isAISpeaking}
            isAI={true}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 20,
  },
  participantsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Platform.select({ web: 32, default: 24 }),
  },
  circleContainer: {
    alignItems: 'center',
    gap: 15,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: Platform.select({ web: 63, default: 50 }),
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 55, // Add padding to offset the top bias needed
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: 'inset 0px 1.5px 0.25px rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(22px)',
      },
    }),
  },
  circleInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  voiceBarsContainer: {
    height: MAX_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: BAR_COUNT * 6 + (BAR_COUNT - 1) * 8,
  },
  voiceBar: {
    width: 6,
    borderRadius: 35,
  },
});
