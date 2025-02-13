import { useVoiceAssistant } from '@livekit/components-react';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface ParticipantCircleProps {
  label: string;
  isActive?: boolean;
  opacity?: number;
  isSpeaking?: boolean;
}

const ParticipantCircle: React.FC<ParticipantCircleProps> = ({
  label,
  isActive = false,
  opacity = 1,
  isSpeaking = false,
}) => {
  // Create animated values for each voice bar
  const animationValues = useRef([
    new Animated.Value(4),
    new Animated.Value(4),
    new Animated.Value(4),
    new Animated.Value(4),
  ]).current;

  return (
    <View style={[styles.circleContainer, { opacity }]}>
      <View style={[styles.circle, isSpeaking && styles.circleSpeaking]}>
        {isSpeaking && (
          <View style={styles.voiceBarsContainer}>
            {animationValues.map((anim, i) => (
              <Animated.View key={i} style={[styles.voiceBar, { height: anim }]} />
            ))}
          </View>
        )}
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
      <LinearGradient
        colors={['#007AFF', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}>
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
      </LinearGradient>
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
    width: Platform.select({ web: 126, default: 100 }),
    height: Platform.select({ web: 126, default: 100 }),
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  circleSpeaking: {
    backgroundColor: Colors.light.tint,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  voiceBarsContainer: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  voiceBar: {
    width: 4,
    backgroundColor: Colors.light.background,
    borderRadius: 2,
  },
});
