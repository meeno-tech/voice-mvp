import { useLocalParticipant, useRemoteParticipant } from '@livekit/components-react';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface AudioVisualizerProps {
  participantIdentity?: string;
  isLocal?: boolean;
  barCount?: number;
  minHeight?: number;
  maxHeight?: number;
  barWidth?: number;
  barSpacing?: number;
  color?: string;
  sensitivityMultiplier?: number;
  label?: string;
}

export const AudioVisualizer = ({
  participantIdentity,
  isLocal = false,
  barCount = 5,
  minHeight = 4,
  maxHeight = 24,
  barWidth = 5,
  barSpacing = 3,
  color = '#3B82F6',
  sensitivityMultiplier = isLocal ? 3 : 4,
  label,
}: AudioVisualizerProps) => {
  const audioLevels = useRef<number[]>(Array(barCount).fill(0));
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const animatedValues = useRef<Animated.SharedValue<number>[]>(
    Array(barCount)
      .fill(0)
      .map(() => useSharedValue(minHeight))
  );

  const localParticipant = useLocalParticipant();
  const remoteParticipant = useRemoteParticipant(participantIdentity || '');
  const participant = isLocal ? localParticipant.localParticipant : remoteParticipant;

  const updateVisualization = (level: number) => {
    if (level < 0.005) {
      level = 0;
    }

    let adjustedLevel = level > 0 ? Math.pow(level, 0.35) * sensitivityMultiplier : 0;
    adjustedLevel = Math.min(1, adjustedLevel);

    if (adjustedLevel > 0.02) {
      adjustedLevel += Math.random() * 0.15 - 0.05;
      adjustedLevel = Math.max(0, Math.min(1, adjustedLevel));
    }

    setVolumeLevel(adjustedLevel);

    const newLevels = audioLevels.current.map(() => {
      const randomFactor = 0.4 + Math.random() * 0.8;
      return Math.max(minHeight, Math.min(maxHeight, adjustedLevel * maxHeight * randomFactor));
    });

    audioLevels.current = newLevels;

    newLevels.forEach((level, index) => {
      animatedValues.current[index].value = withTiming(level, { duration: 80 });
    });
  };

  useEffect(() => {
    if (!participant) return;

    const handleAudioLevelChanged = () => {
      const level = participant.audioLevel || 0;
      updateVisualization(level);
    };

    const handleSpeakingChanged = () => {
      setIsSpeaking(participant.isSpeaking);

      if (!participant.isSpeaking) {
        updateVisualization(0);
      }
    };

    participant.on('isSpeakingChanged', handleSpeakingChanged);

    const intervalId = setInterval(handleAudioLevelChanged, 100);

    setIsSpeaking(participant.isSpeaking);
    updateVisualization(participant.audioLevel || 0);

    return () => {
      participant.off('isSpeakingChanged', handleSpeakingChanged);
      clearInterval(intervalId);
    };
  }, [participant, minHeight, maxHeight, sensitivityMultiplier]);

  const barStyles = Array(barCount)
    .fill(0)
    .map((_, index) => {
      return useAnimatedStyle(() => {
        return {
          height: animatedValues.current[index].value,
        };
      });
    });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (volumeLevel < 0.01 && !isSpeaking) {
      interval = setInterval(() => {
        const idleValues = Array(barCount)
          .fill(0)
          .map(() => minHeight + Math.random() * (minHeight * 0.5));

        idleValues.forEach((value, index) => {
          animatedValues.current[index].value = withTiming(value, { duration: 800 });
        });
      }, 800);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [volumeLevel, isSpeaking, barCount, minHeight]);

  const displayName = label || (isLocal ? 'You' : participant?.name || 'AI');

  return (
    <View className="items-center justify-center">
      <View
        className="mb-2 h-24 w-24 items-center justify-center rounded-full bg-white"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}>
        <View className="h-14 flex-row items-center justify-center">
          {Array(barCount)
            .fill(0)
            .map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  barStyles[index],
                  {
                    width: barWidth,
                    marginHorizontal: barSpacing / 2,
                    backgroundColor: color,
                    borderRadius: 2,
                  },
                ]}
              />
            ))}
        </View>
      </View>
      <Text className="text-center text-base font-medium text-black">{displayName}</Text>
    </View>
  );
};
