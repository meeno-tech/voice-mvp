import { useVoiceAssistant } from '@livekit/components-react';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface ParticipantCircleProps {
  label: string;
  isActive?: boolean;
  opacity?: number;
  isSpeaking?: boolean;
}

const BAR_COUNT = 4;
const BASE_DURATION = 1200; // Slower base duration
const VARIATION_DURATION = 400; // Less variation
const MIN_HEIGHT = 14;
const MAX_HEIGHT = 54;
const CUSTOM_EASING = Easing.inOut(Easing.sin);

const ParticipantCircle: React.FC<ParticipantCircleProps> = ({
  label,
  isActive = false,
  opacity = 1,
  isSpeaking = false,
}) => {
  // Initialize animation values to 0 (resting state)
  const animationValues = useRef(
    Array(BAR_COUNT)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  // Add a ref to track mounted state
  const isMounted = useRef(false);

  // Handle mounting and initial state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      const createSpeechAnimation = (value: Animated.Value, index: number) => {
        // Create a base pattern that mimics speech
        const getNextHeight = () => {
          // More natural height variation based on position
          const baseHeight = 0.3 + (index % 2 ? 0.2 : 0);
          return baseHeight + Math.random() * 0.3;
        };

        return Animated.sequence([
          Animated.timing(value, {
            toValue: getNextHeight(),
            duration: BASE_DURATION + Math.random() * VARIATION_DURATION,
            easing: CUSTOM_EASING,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: getNextHeight(),
            duration: BASE_DURATION + Math.random() * VARIATION_DURATION,
            easing: CUSTOM_EASING,
            useNativeDriver: false,
          }),
        ]);
      };

      // Create slightly offset animations for each bar
      const animations = animationValues.map((value, index) => {
        // Add slight delay between bars for more natural movement
        const delay = index * 100;
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(createSpeechAnimation(value, index)),
        ]);
      });

      // Start all animations
      animations.forEach((anim) => anim.start());

      // Cleanup function
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
          easing: CUSTOM_EASING,
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

  const getBarOpacity = (index: number) => {
    const baseOpacity = 0.15;
    const maxOpacity = 1;

    return animationValues[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [baseOpacity, maxOpacity, baseOpacity],
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
                  opacity: getBarOpacity(index),
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
          />
          <ParticipantCircle
            label="AI"
            isActive={isAISpeaking}
            opacity={state === 'disconnected' ? 0.25 : 1}
            isSpeaking={isAISpeaking}
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
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  voiceBarsContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  voiceBar: {
    width: 6,
    backgroundColor: '#007AFF',
    borderRadius: 35,
  },
});
