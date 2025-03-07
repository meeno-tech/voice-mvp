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
    convergenceFactor: 1.0, // Starts at 1.0 (full variation) and decreases over time
    targetShape: Array(pointCount).fill(height / 2), // The shape we're converging toward
    isFirstShape: true, // Track if this is the first shape after initialization
    hasGeneratedInitialShape: false, // Track if we've generated the initial shape
    hasSpokenAtLeastOnce: false, // Track if the user has spoken at least once
    finalShapeSeed: Math.floor(Math.random() * 1000000), // Seed for the final shape
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

  const [pathData, setPathData] = useState(() => {
    return generatePath(Array(pointCount).fill({ y: height / 2 }));
  });

  useEffect(() => {
    const updatePath = () => {
      const currentPoints = controlPoints.current.map((point) => ({
        y: point.y.value,
      }));
      setPathData(generatePath(currentPoints));
    };

    const pathUpdateInterval = setInterval(updatePath, 16); // ~60fps

    return () => {
      clearInterval(pathUpdateInterval);
    };
  }, [height, pointCount, screenWidth]);

  // Generate the final target shape that we'll converge toward
  const generateFinalTargetShape = () => {
    console.log('Generating final target shape with seed:', voiceData.current.finalShapeSeed);

    let seed = voiceData.current.finalShapeSeed;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Generate a complex, interesting target shape
    for (let i = 0; i < pointCount; i++) {
      const position = i / (pointCount - 1);
      const basePhase = random() * Math.PI;
      let targetY = Math.sin(position * Math.PI * 2 + basePhase) * height * 0.35;
      targetY += Math.sin(position * Math.PI * 3.7 + basePhase * 1.5) * height * 0.2;
      targetY += Math.sin(position * Math.PI * 5.3 + basePhase * 0.7) * height * 0.1;

      targetY += (random() * 2 - 1) * height * 0.15;

      const edgeFactor = Math.min(i, pointCount - 1 - i) / (pointCount / 3);
      const centeringForce = 1 - Math.min(1, edgeFactor);
      targetY *= 1 - centeringForce * 0.6;

      // Ensure the point is at least a minimum distance from center
      const minDistanceFromCenter = height * 0.12;
      if (Math.abs(targetY) < minDistanceFromCenter) {
        targetY = (targetY >= 0 ? 1 : -1) * minDistanceFromCenter;
      }

      voiceData.current.targetShape[i] = height / 2 + targetY;
    }
  };

  // Set new target positions and animate to them
  const animateToNewWave = (baseAmplitude = 0.3, variationAmount = 0.15, seed = Date.now()) => {
    voiceData.current.shapeCounter++;
    voiceData.current.lastShapeTime = Date.now();

    // Seeded random function
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    if (voiceData.current.isFirstShape) {
      // Generate the final target shape
      generateFinalTargetShape();
      voiceData.current.isFirstShape = false;
      voiceData.current.convergenceFactor = 1.0;
    } else {
      // First speaking event: convergence = 1.0 (initial shape)
      // Second speaking event: convergence = 0.8 (20% refinement)
      // Third speaking event: convergence = 0.6 (40% refinement)
      // Fourth speaking event: convergence = 0.4 (60% refinement)

      if (voiceData.current.shapeCounter === 2) {
        voiceData.current.convergenceFactor = 0.8;
      } else if (voiceData.current.shapeCounter === 3) {
        voiceData.current.convergenceFactor = 0.6;
      } else if (voiceData.current.shapeCounter === 4) {
        voiceData.current.convergenceFactor = 0.4;
      } else {
        voiceData.current.convergenceFactor = 0.2;
      }

      console.log(
        `Subtle refinement: now at ${(100 - voiceData.current.convergenceFactor * 100).toFixed(0)}% refinement`
      );
    }

    // Generate new target positions
    controlPoints.current.forEach((point, i) => {
      // Cancel any ongoing animations
      cancelAnimation(point.y);

      const position = i / (pointCount - 1);

      // Use the shape counter to create different patterns
      // For subsequent shapes, use a phase shift that's closer to the original
      // to maintain similarity with the first shape
      const initialPhaseShift = 0.7;
      const phaseVariation = voiceData.current.convergenceFactor * 0.5;
      const phaseShift =
        initialPhaseShift + phaseVariation * Math.sin(voiceData.current.shapeCounter);

      // Base wave using sine function with phase shift
      const minAmplitude = 0.2;
      const effectiveAmplitude = Math.max(minAmplitude, baseAmplitude);

      let targetOffset =
        Math.sin(position * Math.PI * 2 + phaseShift) * height * effectiveAmplitude * 0.7;
      targetOffset +=
        Math.sin(position * Math.PI * 3.7 + phaseShift * 1.5) * height * effectiveAmplitude * 0.3;

      const minVariation = 0.08;
      const effectiveVariation = Math.max(
        minVariation,
        variationAmount * voiceData.current.convergenceFactor
      );
      targetOffset += (random() * 2 - 1) * height * effectiveVariation;

      // Keep endpoints closer to center
      const edgeFactor = Math.min(i, pointCount - 1 - i) / (pointCount / 3);
      const centeringForce = 1 - Math.min(1, edgeFactor);
      targetOffset *= 1 - centeringForce * 0.7;

      // Calculate new target - blend between random shape and target shape based on convergence
      const randomTarget = height / 2 + targetOffset;
      let finalTarget;

      if (voiceData.current.shapeCounter === 1) {
        finalTarget = randomTarget;
      } else {
        const refinementFactor = Math.pow(1 - voiceData.current.convergenceFactor, 0.8) * 0.5;
        finalTarget =
          randomTarget * (1 - refinementFactor) +
          voiceData.current.targetShape[i] * refinementFactor;
      }
      const distanceFromCenter = Math.abs(finalTarget - height / 2);
      const minDistanceFromCenter = height * 0.1;

      if (distanceFromCenter < minDistanceFromCenter) {
        const direction = finalTarget >= height / 2 ? 1 : -1;
        finalTarget = height / 2 + direction * minDistanceFromCenter;
      }

      // Faster animations for early shapes, slower for refinements
      const duration = 600 + random() * 300 + (1 - voiceData.current.convergenceFactor) * 400;
      point.y.value = withTiming(finalTarget, {
        duration: duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    });
  };

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
    voiceData.current.hasSpokenAtLeastOnce = true;

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
      Math.max(0.25, Math.min(0.5, avgVolume * 0.6)) *
      (0.8 + Math.random() * 0.2) *
      (0.6 + voiceData.current.convergenceFactor * 0.4);

    const variationAmount =
      Math.max(0.15, Math.min(0.3, volumeVariance * 0.4)) *
      (0.8 + Math.random() * 0.2) *
      (0.5 + voiceData.current.convergenceFactor * 0.5);

    // Animate to new wave shape
    animateToNewWave(
      baseAmplitude,
      variationAmount,
      Date.now() + voiceData.current.shapeCounter * 1000
    );
    voiceData.current.volumeHistory = [];

    console.log('Generated new wave shape');
  };

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

        if (voiceData.current.volumeHistory.length > 20) {
          voiceData.current.volumeHistory.shift();
        }

        if (!isSpeaking) {
          console.log('Started speaking (from audio level)');
          setIsSpeaking(true);
          voiceData.current.speakingStartTime = Date.now();
        }
      }

      const now = Date.now();
      if (isSpeaking && now - voiceData.current.lastSignificantLevel > 1000) {
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

    const handleSpeakingChanged = () => {
      const isSpeakingNow = localParticipant.localParticipant.isSpeaking;

      console.log('Speaking state changed:', isSpeakingNow);

      if (!isSpeakingNow && isSpeaking) {
        console.log('Stopped speaking (from event)');
        if (voiceData.current.volumeHistory.length > 0) {
          console.log('Generating shape from speaking event end');
          generateVoiceBasedShape();
        }
        pathOpacity.value = withTiming(0.8, { duration: 500 });
      }

      if (isSpeakingNow && !isSpeaking) {
        console.log('Started speaking (from event)');
        pathOpacity.value = withTiming(0.6, { duration: 300 });
      }

      setIsSpeaking(isSpeakingNow);
    };

    localParticipant.localParticipant.on('isSpeakingChanged', handleSpeakingChanged);
    setIsSpeaking(localParticipant.localParticipant.isSpeaking);
    if (!voiceData.current.hasGeneratedInitialShape) {
      animateToStraightLine(true);
      voiceData.current.hasGeneratedInitialShape = true;
    }

    const audioMonitorInterval = setInterval(monitorAudioLevels, 100);

    const shapeRefreshInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastShape = now - voiceData.current.lastShapeTime;

      // Only refresh if user has spoken at least once, it's been a while,
      // and they're not currently speaking
      if (voiceData.current.hasSpokenAtLeastOnce && timeSinceLastShape > 15000 && !isSpeaking) {
        console.log('Refreshing wave shape due to inactivity');
        animateToNewWave(0.1, 0.05, now);
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
