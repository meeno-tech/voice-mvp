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
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import {
  addDetailPoints,
  createExtremeKeypoints,
  createRandomGenerator,
  generateGlowAreaPath,
  generatePath,
  generatePrimaryPoints,
  interpolateWithKeypoints,
} from 'utils/waveUtils';

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
    convergenceFactor: 1.0,
    targetShape: Array(pointCount).fill(height / 2),
    isFirstShape: true,
    hasGeneratedInitialShape: false,
    hasSpokenAtLeastOnce: false,
    finalShapeSeed: Math.floor(Math.random() * 1000000),
    waveParameters: null as {
      keyPoints: Array<{ x: number; y: number }>;
      initialHeight: number;
      extremeKeyPoints: Array<Array<{ x: number; y: number }>>;
    } | null,
  });

  const [pathData, setPathData] = useState(() => {
    return generatePath(Array(pointCount).fill({ y: height / 2 }));
  });

  const [glowAreaPathData, setGlowAreaPathData] = useState(() => {
    return generateGlowAreaPath(Array(pointCount).fill({ y: height / 2 }), height);
  });

  useEffect(() => {
    const updatePath = () => {
      const currentPoints = controlPoints.current.map((point) => ({
        y: point.y.value,
      }));
      setPathData(generatePath(currentPoints));
      setGlowAreaPathData(generateGlowAreaPath(currentPoints, height));
    };

    const pathUpdateInterval = setInterval(updatePath, 16); // ~60fps

    return () => {
      clearInterval(pathUpdateInterval);
    };
  }, [height, pointCount, screenWidth]);

  // Generate the final target shape that we'll converge toward
  const generateFinalTargetShape = () => {
    console.log('Generating final target shape with seed:', voiceData.current.finalShapeSeed);

    const random = createRandomGenerator(voiceData.current.finalShapeSeed);

    // Generate primary points that define overall wave trend
    const primaryPoints = generatePrimaryPoints(pointCount, height, random);

    // Add detail points for more natural look
    const keyPoints = addDetailPoints(primaryPoints, height, random);

    // Store the initial key points
    voiceData.current.waveParameters = {
      keyPoints: keyPoints.map((point) => ({ ...point })),
      initialHeight: height,
      extremeKeyPoints: [],
    };

    // Calculate the actual curve points
    for (let i = 0; i < pointCount; i++) {
      const x = i / (pointCount - 1);
      const y = interpolateWithKeypoints(x, keyPoints);
      voiceData.current.targetShape[i] = height / 2 + y;
    }
  };

  // Set new target positions and animate to them
  const animateToNewWave = (seed = Date.now()) => {
    voiceData.current.shapeCounter++;
    voiceData.current.lastShapeTime = Date.now();

    // If this is a completely new session, reset the seed
    if (voiceData.current.shapeCounter === 1) {
      voiceData.current.finalShapeSeed = Math.floor(Math.random() * 1000000);
    }

    const random = createRandomGenerator(seed);

    if (voiceData.current.isFirstShape) {
      generateFinalTargetShape();
      voiceData.current.isFirstShape = false;
      voiceData.current.convergenceFactor = 1.0;
    } else {
      // Get more extreme with each refinement
      if (voiceData.current.shapeCounter === 2) {
        voiceData.current.convergenceFactor = 0.5;

        // Generate intermediate extreme version
        if (
          voiceData.current.waveParameters &&
          !voiceData.current.waveParameters.extremeKeyPoints[0]
        ) {
          const extremePoints = createExtremeKeypoints(
            voiceData.current.waveParameters.keyPoints,
            0.5,
            height
          );
          voiceData.current.waveParameters.extremeKeyPoints[0] = extremePoints;
        }
      } else if (voiceData.current.shapeCounter >= 3) {
        voiceData.current.convergenceFactor = 0.0;

        // Generate final extreme version
        if (
          voiceData.current.waveParameters &&
          !voiceData.current.waveParameters.extremeKeyPoints[1]
        ) {
          const extremePoints = createExtremeKeypoints(
            voiceData.current.waveParameters.keyPoints,
            1.0,
            height
          );
          voiceData.current.waveParameters.extremeKeyPoints[1] = extremePoints;
        }
      }

      console.log(
        `Refinement: now at ${(100 - voiceData.current.convergenceFactor * 100).toFixed(0)}% refinement (more extreme)`
      );
    }

    // Generate new target positions
    controlPoints.current.forEach((point, i) => {
      // Cancel any ongoing animations
      cancelAnimation(point.y);

      const position = i / (pointCount - 1);
      let targetOffset;

      if (voiceData.current.isFirstShape || !voiceData.current.waveParameters) {
        // For the first shape, generate a random interesting wave
        const initialKeyPointCount = 8 + Math.floor(random() * 5);
        const initialKeyPoints: Array<{ x: number; y: number }> = [];

        // Generate random key points with varied distribution
        for (let i = 0; i < initialKeyPointCount; i++) {
          const xBase = i / (initialKeyPointCount - 1);
          let x = xBase;

          if (i > 0 && i < initialKeyPointCount - 1) {
            const maxJitter = 0.5 / initialKeyPointCount;
            x = xBase + (random() * 2 - 1) * maxJitter;
          }

          let y;
          if (i === 0) {
            y = (random() * 0.9 - 0.45) * height;
          } else {
            const prevY = initialKeyPoints[i - 1].y;
            const shiftProbability = 0.4;

            if (random() < shiftProbability) {
              const direction = random() < 0.5 ? -1 : 1;
              const shiftMagnitude = (0.15 + random() * 0.3) * height;
              y = prevY + direction * shiftMagnitude;
            } else {
              const maxChange = 0.2 * height * (1 - Math.pow(Math.abs(xBase - 0.5) * 2, 2));
              y = prevY + (random() * 2 - 1) * maxChange;
            }
          }

          const boundedY = Math.max(Math.min(y, height * 0.48), -height * 0.48);
          initialKeyPoints.push({ x, y: boundedY });
        }

        initialKeyPoints.sort((a, b) => a.x - b.x);
        targetOffset = interpolateWithKeypoints(position, initialKeyPoints);

        // Add small noise for texture
        targetOffset += (random() * 2 - 1) * height * 0.02;
      } else {
        // Calculate based on how extreme we want to be
        const { keyPoints, extremeKeyPoints } = voiceData.current.waveParameters;
        let finalY;

        if (voiceData.current.shapeCounter === 2) {
          // Blend between initial and intermediate extreme
          const initialY = interpolateWithKeypoints(position, keyPoints);
          const intermediateY = interpolateWithKeypoints(position, extremeKeyPoints[0]);
          const progress = 1 - voiceData.current.convergenceFactor;
          finalY = initialY * (1 - progress) + intermediateY * progress;
        } else if (voiceData.current.shapeCounter >= 3) {
          // Blend between intermediate and final extreme
          const intermediateY = interpolateWithKeypoints(position, extremeKeyPoints[0]);
          const finalExtremeY = interpolateWithKeypoints(position, extremeKeyPoints[1]);
          const progress = 1 - voiceData.current.convergenceFactor;
          finalY = intermediateY * (1 - progress) + finalExtremeY * progress;
        } else {
          finalY = interpolateWithKeypoints(position, keyPoints);
        }

        targetOffset = finalY;

        // Add decreasing noise as we get more extreme
        const noiseAmount = 0.03 * voiceData.current.convergenceFactor;
        targetOffset += (random() * 2 - 1) * height * noiseAmount;
      }

      // Calculate final target position
      const finalTarget = height / 2 + targetOffset;

      // Animate to the target
      point.y.value = withTiming(finalTarget, {
        duration: 700 + random() * 200,
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
      animateToNewWave(Date.now() + voiceData.current.shapeCounter * 1000);
      return;
    }

    // Calculate average volume
    const volumes = voiceData.current.volumeHistory;
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

    // Calculate volume variance
    const volumeVariance =
      volumes.reduce((sum, vol) => sum + Math.abs(vol - avgVolume), 0) / volumes.length;

    console.log(`Voice data: avg=${avgVolume.toFixed(2)}, variance=${volumeVariance.toFixed(2)}`);

    // Create a unique seed for this shape
    const uniqueSeed = Date.now() + Math.floor(Math.random() * 10000);

    // Animate to new wave shape
    animateToNewWave(uniqueSeed);
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
        animateToNewWave(Date.now());
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
    <View style={{ height, width: '100%', overflow: 'hidden' }}>
      <Animated.View style={[{ width: '100%', height: '100%' }, pathStyle]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={waveColor} stopOpacity="0.3" />
              <Stop offset="0.3" stopColor={waveColor} stopOpacity="0.15" />
              <Stop offset="0.7" stopColor={waveColor} stopOpacity="0.05" />
              <Stop offset="1" stopColor={waveColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Glow area below the line */}
          <Path d={glowAreaPathData} fill="url(#glowGradient)" strokeWidth={0} />

          {/* Main line */}
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
