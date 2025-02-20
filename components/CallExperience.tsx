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

const BAR_COUNT = 5;
const BASE_DURATION = 1600; // Adjusted duration for more natural wave
const MIN_HEIGHT = 14;
const MAX_HEIGHT = 54;
const CENTER_OFFSET = 27; // Half of MAX_HEIGHT to center the bars

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

  const cycleAnimations = useRef<Animated.CompositeAnimation[]>([]);

  const createContinuousWaveAnimation = (value: Animated.Value) => {
    // Create a continuous animation that loops smoothly with full extension
    return Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: BASE_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: BASE_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
  };

  useEffect(() => {
    if (isSpeaking) {
      // Stop any existing animations
      cycleAnimations.current.forEach((anim) => anim.stop());
      cycleAnimations.current = [];

      // Stagger the start of animations slightly
      const animations = animationValues.map((value, index) => {
        const animation = createContinuousWaveAnimation(value);

        // Add a small delay for each subsequent bar
        setTimeout(() => {
          animation.start();
        }, index * 100);

        return animation;
      });

      cycleAnimations.current = animations;

      return () => {
        animations.forEach((anim) => anim.stop());
        animationValues.forEach((value) => value.setValue(0));
      };
    } else {
      // Stop and reset animations when not speaking
      cycleAnimations.current.forEach((anim) => anim.stop());

      // Animate reset with a slight stagger
      animationValues.forEach((value, index) => {
        setTimeout(() => {
          Animated.timing(value, {
            toValue: 0,
            duration: 400,
            easing: Easing.linear,
            useNativeDriver: false,
          }).start();
        }, index * 50);
      });

      // Clear animations
      cycleAnimations.current = [];
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
    // More dynamic opacity based on bar height
    return animationValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });
  };

  return (
    <View style={[styles.circleContainer, { opacity }]}>
      <View style={[styles.circle, !isActive && styles.circleInactive]}>
        <View style={styles.voiceBarsContainer}>
          {animationValues.map((animValue, index) => (
            <Animated.View
              key={index}
              style={[
                styles.voiceBar,
                {
                  height: getBarHeight(index),
                  opacity: getBarOpacity(index, isAI, animValue),
                  backgroundColor: isAI ? '#FF2D55' : '#007AFF',
                  transform: [{ translateY: -CENTER_OFFSET }],
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
    paddingTop: 55,
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
