import { useLocalParticipant } from '@livekit/components-react';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface WaveVisualizerProps {
  height?: number;
  waveColor?: string;
  pointCount?: number;
}

export const WaveVisualizer = ({
  height = 120,
  waveColor = 'rgba(100, 100, 255, 0.7)',
  pointCount = 12,
}: WaveVisualizerProps) => {
  const { width: screenWidth } = Dimensions.get('window');
  const localParticipant = useLocalParticipant();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pathOpacity = useSharedValue(0.7);

  // Create animated values for each control point
  const controlPoints = useRef(
    Array(pointCount)
      .fill(0)
      .map(() => ({
        y: useSharedValue(height / 2),
        targetY: height / 2,
      }))
  );

  // Track voice characteristics
  const voiceData = useRef({
    volumeHistory: [] as number[],
    lastSignificantLevel: 0,
    speakingStartTime: 0,
    speakingEndTime: 0,
    shapeCounter: 0,
    lastShapeTime: 0,
  });

  // Generate a smooth path from control points
  const generatePath = (points: { y: number }[]) => {
    if (points.length < 2) return '';

    const segmentWidth = screenWidth / (points.length - 1);
    let path = `M 0,${points[0].y}`;

    // Use cubic bezier curves for extra smoothness
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = i * segmentWidth;
      const x2 = (i + 1) * segmentWidth;

      // Control points for the cubic bezier
      const cp1x = x1 + segmentWidth / 3;
      const cp2x = x2 - segmentWidth / 3;

      path += ` C ${cp1x},${points[i].y} ${cp2x},${points[i + 1].y} ${x2},${points[i + 1].y}`;
    }

    return path;
  };

  // State to hold the current path data
  const [pathData, setPathData] = useState(() => {
    // Initialize with a straight line
    return generatePath(Array(pointCount).fill({ y: height / 2 }));
  });

  // Update path data when animated values change
  useEffect(() => {
    // Create a function to update the path
    const updatePath = () => {
      const currentPoints = controlPoints.current.map((point) => ({
        y: point.y.value,
      }));
      setPathData(generatePath(currentPoints));
    };

    // Set up an interval to update the path regularly
    const pathUpdateInterval = setInterval(updatePath, 16); // ~60fps

    return () => {
      clearInterval(pathUpdateInterval);
    };
  }, [height, pointCount, screenWidth]);

  // Set new target positions and animate to them
  const animateToNewWave = (baseAmplitude = 0.3, variationAmount = 0.15, seed = Date.now()) => {
    console.log(
      `Animating to new wave: amplitude=${baseAmplitude}, variation=${variationAmount}, seed=${seed}`
    );

    // Increment shape counter
    voiceData.current.shapeCounter++;
    voiceData.current.lastShapeTime = Date.now();

    // Seeded random function
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Generate new target positions
    controlPoints.current.forEach((point, i) => {
      // Cancel any ongoing animations
      cancelAnimation(point.y);

      // Position in the array (0 to 1)
      const position = i / (pointCount - 1);

      // Use the shape counter to create different patterns
      const phaseShift = voiceData.current.shapeCounter * 0.7;

      // Base wave using sine function with phase shift
      let targetOffset =
        Math.sin(position * Math.PI * 2 + phaseShift) * height * baseAmplitude * 0.7;
      targetOffset +=
        Math.sin(position * Math.PI * 3.7 + phaseShift * 1.5) * height * baseAmplitude * 0.3;

      // Add controlled variation
      targetOffset += (random() * 2 - 1) * height * variationAmount;

      // Keep endpoints closer to center
      const edgeFactor = Math.min(i, pointCount - 1 - i) / (pointCount / 3);
      const centeringForce = 1 - Math.min(1, edgeFactor);
      targetOffset *= 1 - centeringForce * 0.8;

      // Calculate new target
      const newTarget = height / 2 + targetOffset;

      // Ensure significant movement (at least 15% of height)
      const minMovement = height * 0.15;
      const currentY = point.y.value;
      let finalTarget = newTarget;

      if (Math.abs(currentY - newTarget) < minMovement) {
        finalTarget = newTarget + (random() > 0.5 ? 1 : -1) * minMovement;
      }

      // Animate to the new target with easing
      point.y.value = withTiming(finalTarget, {
        duration: 800 + random() * 400, // Slightly different duration for each point
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    });
  };

  // Set to straight line
  const animateToStraightLine = (immediate = false) => {
    controlPoints.current.forEach((point) => {
      if (immediate) {
        point.y.value = height / 2;
      } else {
        point.y.value = withTiming(height / 2, {
          duration: 600,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    });
  };

  // Generate a wave shape based on voice data
  const generateVoiceBasedShape = () => {
    console.log(
      `Generating voice shape (history length=${voiceData.current.volumeHistory.length})`
    );

    // If we don't have enough data, use default values
    if (voiceData.current.volumeHistory.length < 2) {
      console.log('Not enough voice data, using default shape');
      animateToNewWave(0.3, 0.15, Date.now() + voiceData.current.shapeCounter * 1000);
      return;
    }

    // Calculate average volume
    const volumes = voiceData.current.volumeHistory;
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

    // Calculate volume variance
    const volumeVariance =
      volumes.reduce((sum, vol) => sum + Math.abs(vol - avgVolume), 0) / volumes.length;

    console.log(`Voice data: avg=${avgVolume.toFixed(2)}, variance=${volumeVariance.toFixed(2)}`);

    // Use voice characteristics with minimum values to ensure visible waves
    const baseAmplitude =
      Math.max(0.25, Math.min(0.5, avgVolume * 0.6)) * (0.8 + Math.random() * 0.4);
    const variationAmount =
      Math.max(0.15, Math.min(0.3, volumeVariance * 0.4)) * (0.8 + Math.random() * 0.4);

    // Animate to new wave shape
    animateToNewWave(
      baseAmplitude,
      variationAmount,
      Date.now() + voiceData.current.shapeCounter * 1000
    );

    // Reset the collected data
    voiceData.current.volumeHistory = [];

    console.log('Generated new wave shape');
  };

  // Handle speaking state and audio level changes
  useEffect(() => {
    if (!localParticipant.localParticipant) return;

    // Direct audio level monitoring
    const monitorAudioLevels = () => {
      const level = localParticipant.localParticipant.audioLevel || 0;

      // Detect significant audio level changes
      if (level > 0.01) {
        // Store volume data (adjust for better visualization)
        const adjustedLevel = Math.min(1, Math.pow(level, 0.35) * 5);
        voiceData.current.volumeHistory.push(adjustedLevel);
        voiceData.current.lastSignificantLevel = Date.now();

        // Limit history size
        if (voiceData.current.volumeHistory.length > 20) {
          voiceData.current.volumeHistory.shift();
        }

        // If not currently speaking, mark as speaking and record start time
        if (!isSpeaking) {
          console.log('Started speaking (from audio level)');
          setIsSpeaking(true);
          voiceData.current.speakingStartTime = Date.now();
        }
      }

      // Check if we should consider the user to have stopped speaking
      const now = Date.now();
      if (isSpeaking && now - voiceData.current.lastSignificantLevel > 1000) {
        // If no significant audio for 1 second, consider stopped speaking
        console.log('Stopped speaking (from audio level)');
        setIsSpeaking(false);
        voiceData.current.speakingEndTime = now;

        // Calculate speaking duration
        const speakingDuration =
          voiceData.current.speakingEndTime - voiceData.current.speakingStartTime;
        console.log(`Speaking duration: ${speakingDuration}ms`);

        // Generate a new shape when stopping speaking if we have data and spoke for at least 500ms
        if (voiceData.current.volumeHistory.length >= 3 && speakingDuration > 500) {
          console.log('Generating shape after speaking stopped');
          generateVoiceBasedShape();
        }
      }
    };

    // Also listen to the official speaking events
    const handleSpeakingChanged = () => {
      const isSpeakingNow = localParticipant.localParticipant.isSpeaking;

      console.log('Speaking state changed:', isSpeakingNow);

      // If stopped speaking and we have data, generate a new shape
      if (!isSpeakingNow && isSpeaking) {
        console.log('Stopped speaking (from event)');

        // Generate a new shape when the speaking event ends
        if (voiceData.current.volumeHistory.length > 0) {
          console.log('Generating shape from speaking event end');
          generateVoiceBasedShape();
        }
        pathOpacity.value = withTiming(0.8, { duration: 500 });
      }

      // If started speaking, slightly fade the line and clear history
      if (isSpeakingNow && !isSpeaking) {
        console.log('Started speaking (from event)');
        // Clear volume history when starting to speak to collect fresh data
        voiceData.current.volumeHistory = [];
        pathOpacity.value = withTiming(0.6, { duration: 300 });
      }

      setIsSpeaking(isSpeakingNow);
    };

    // Set up event listeners
    localParticipant.localParticipant.on('isSpeakingChanged', handleSpeakingChanged);

    // Initial setup - start with a straight line
    setIsSpeaking(localParticipant.localParticipant.isSpeaking);
    animateToStraightLine(true);

    // Generate an initial subtle wave after a short delay
    setTimeout(() => {
      animateToNewWave(0.15, 0.08, Date.now());
    }, 1000);

    // Monitor audio levels at regular intervals
    const audioMonitorInterval = setInterval(monitorAudioLevels, 100);

    // Periodically generate a new shape if it's been a while since the last one
    // This ensures the wave keeps moving even if there are issues
    const shapeRefreshInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastShape = now - voiceData.current.lastShapeTime;

      // If it's been more than 10 seconds since the last shape change, create a new subtle wave
      if (timeSinceLastShape > 10000) {
        console.log('Refreshing wave shape due to inactivity');
        animateToNewWave(0.15, 0.08, now);
      }
    }, 5000);

    return () => {
      localParticipant.localParticipant.off('isSpeakingChanged', handleSpeakingChanged);
      clearInterval(audioMonitorInterval);
      clearInterval(shapeRefreshInterval);
    };
  }, [localParticipant.localParticipant, isSpeaking, height, pointCount]);

  // Create animated style for opacity
  const pathStyle = useAnimatedStyle(() => {
    return {
      opacity: pathOpacity.value,
    };
  });

  return (
    <View style={{ height, width: '100%' }}>
      <Animated.View style={[{ width: '100%', height: '100%' }, pathStyle]}>
        <Svg width="100%" height="100%">
          <Path
            d={pathData}
            stroke={waveColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
