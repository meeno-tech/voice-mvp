/**
 * Utility functions for wave visualization mathematics
 */

import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Generates a smooth SVG path from control points
 */
export const generatePath = (points: { y: number }[], width = screenWidth) => {
  if (points.length < 2) return '';

  const segmentWidth = width / (points.length - 1);
  let path = `M 0,${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const x1 = i * segmentWidth;
    const x2 = (i + 1) * segmentWidth;
    const cp1x = x1 + segmentWidth / 3;
    const cp2x = x2 - segmentWidth / 3;

    path += ` C ${cp1x},${points[i].y} ${cp2x},${points[i + 1].y} ${x2},${points[i + 1].y}`;
  }

  path += ` L ${width},${points[points.length - 1].y}`;
  return path;
};

/**
 * Generates a filled area path below the wave line
 */
export const generateGlowAreaPath = (
  points: { y: number }[],
  height: number,
  width = screenWidth
) => {
  if (points.length < 2) return '';

  const segmentWidth = width / (points.length - 1);
  let path = `M 0,${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const x1 = i * segmentWidth;
    const x2 = (i + 1) * segmentWidth;
    const cp1x = x1 + segmentWidth / 3;
    const cp2x = x2 - segmentWidth / 3;

    path += ` C ${cp1x},${points[i].y} ${cp2x},${points[i + 1].y} ${x2},${points[i + 1].y}`;
  }

  path += ` L ${width},${points[points.length - 1].y}`;
  path += ` L ${width},${height}`;
  path += ` L 0,${height}`;
  path += ' Z';

  return path;
};

/**
 * Creates a seeded random number generator
 */
export const createRandomGenerator = (seed: number) => {
  let currentSeed = seed;

  return () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
};

/**
 * Generates primary control points for a wave
 */
export const generatePrimaryPoints = (pointCount: number, height: number, random: () => number) => {
  const numPrimaryPoints = 4 + Math.floor(random() * 3);
  const primaryPoints: Array<{ x: number; y: number }> = [];
  let prevY = 0;
  const maxYChange = height * 0.9;

  for (let i = 0; i < numPrimaryPoints; i++) {
    const x = i / (numPrimaryPoints - 1);
    let y;

    if (i === 0) {
      y = (random() * 0.8 - 0.4) * height;
    } else if (i === numPrimaryPoints - 1) {
      const startY = primaryPoints[0].y;
      const oppositeY = -startY * (0.7 + random() * 1.0);
      y = oppositeY * 0.8 + (random() * 0.8 - 0.4) * height * 0.3;
    } else {
      const shiftProbability = 0.6;
      if (random() < shiftProbability) {
        const direction = random() < 0.5 ? -1 : 1;
        const shiftMagnitude = (0.4 + random() * 0.5) * maxYChange;
        y = prevY + direction * shiftMagnitude;
      } else {
        const walkMagnitude = random() * 0.3 * maxYChange;
        const direction = random() < 0.5 ? -1 : 1;
        y = prevY + direction * walkMagnitude;
      }
    }

    y = Math.max(Math.min(y, height * 0.48), -height * 0.48);
    primaryPoints.push({ x, y });
    prevY = y;
  }

  return primaryPoints;
};

/**
 * Adds detail points between primary points for more natural wave shapes
 */
export const addDetailPoints = (
  primaryPoints: Array<{ x: number; y: number }>,
  height: number,
  random: () => number
) => {
  const keyPoints = [...primaryPoints];

  for (let i = 0; i < primaryPoints.length - 1; i++) {
    const p1 = primaryPoints[i];
    const p2 = primaryPoints[i + 1];
    const numDetailPoints = 2 + Math.floor(random() * 3);

    for (let j = 0; j < numDetailPoints; j++) {
      const t = (j + 1) / (numDetailPoints + 1);
      const adjustedT = t * (0.85 + random() * 0.3);
      const x = p1.x + (p2.x - p1.x) * adjustedT;
      const baseY = p1.y + (p2.y - p1.y) * adjustedT;
      const middleness = 4 * adjustedT * (1 - adjustedT);
      const detailIntensity = (0.15 + random() * 0.25) * height * middleness;
      const detailY = baseY + (random() * 2 - 1) * detailIntensity;
      const boundedY = Math.max(Math.min(detailY, height * 0.48), -height * 0.48);

      let insertIdx = i + 1;
      while (insertIdx < keyPoints.length && keyPoints[insertIdx].x < x) {
        insertIdx++;
      }

      keyPoints.splice(insertIdx, 0, { x, y: boundedY });
    }
  }

  return keyPoints.sort((a, b) => a.x - b.x);
};

/**
 * Creates a more extreme version of wave keypoints
 */
export const createExtremeKeypoints = (
  keyPoints: Array<{ x: number; y: number }>,
  extremeFactor: number,
  height: number
): Array<{ x: number; y: number }> => {
  const extremePoints = keyPoints.map((point) => ({ ...point }));

  extremePoints.forEach((point, i) => {
    const distanceFromCenter = point.y;
    const pointVariation = 0.9 + Math.sin(i * 0.5) * 0.3;
    point.y = distanceFromCenter * (1 + extremeFactor * 1.2 * pointVariation);
    point.y = Math.max(Math.min(point.y, height * 0.48), -height * 0.48);
  });

  const newExtremePoints = [...extremePoints];
  const pointsToAdd: Array<{ x: number; y: number; insertAfter: number }> = [];

  for (let i = 0; i < extremePoints.length - 1; i++) {
    const p1 = extremePoints[i];
    const p2 = extremePoints[i + 1];
    const segmentLength = p2.x - p1.x;

    if (segmentLength > 0.1) {
      const t = 0.3 + Math.random() * 0.4;
      const x = p1.x + segmentLength * t;
      const baseY = p1.y + (p2.y - p1.y) * t;
      const detailDeviation = (p2.y - p1.y) * 0.3 * (Math.random() * 2 - 1);
      const y = baseY + detailDeviation;
      pointsToAdd.push({ x, y, insertAfter: i });
    }
  }

  let inserted = 0;
  pointsToAdd.forEach((point) => {
    newExtremePoints.splice(point.insertAfter + 1 + inserted, 0, { x: point.x, y: point.y });
    inserted++;
  });

  return newExtremePoints.sort((a, b) => a.x - b.x);
};

/**
 * Interpolates a point using Catmull-Rom spline with given keypoints
 */
export const interpolateWithKeypoints = (
  x: number,
  keyPoints: Array<{ x: number; y: number }>
): number => {
  let i1 = 0;
  let i2 = keyPoints.length - 1;

  for (let i = 0; i < keyPoints.length - 1; i++) {
    if (keyPoints[i].x <= x && keyPoints[i + 1].x >= x) {
      i1 = i;
      i2 = i + 1;
      break;
    }
  }

  const p1 = keyPoints[i1];
  const p2 = keyPoints[i2];

  if (Math.abs(x - p1.x) < 0.0001) return p1.y;
  if (Math.abs(x - p2.x) < 0.0001) return p2.y;

  const t = (x - p1.x) / (p2.x - p1.x);
  const p0 = i1 > 0 ? keyPoints[i1 - 1] : { x: p1.x - (p2.x - p1.x), y: p1.y };
  const p3 = i2 < keyPoints.length - 1 ? keyPoints[i2 + 1] : { x: p2.x + (p2.x - p1.x), y: p2.y };

  const t2 = t * t;
  const t3 = t2 * t;

  const a = -0.5 * p0.y + 1.5 * p1.y - 1.5 * p2.y + 0.5 * p3.y;
  const b = p0.y - 2.5 * p1.y + 2 * p2.y - 0.5 * p3.y;
  const c = -0.5 * p0.y + 0.5 * p2.y;
  const d = p1.y;

  return a * t3 + b * t2 + c * t + d;
};
