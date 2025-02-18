// utils/roomUtils.ts
import { nanoid } from 'nanoid';

export const ROOM_NAME_SEPARATOR = ':';

/**
 * Generates a unique room identifier by combining the base room name with a random string
 * @param baseRoomName - The original room name from the scene
 * @returns string - A unique room identifier
 */
export const generateUniqueRoomName = (baseRoomName: string): string => {
  // Generate a short random string (6 characters)
  const randomSuffix = nanoid(6);
  // Combine the base name with the random string using a separator
  return `${baseRoomName}${ROOM_NAME_SEPARATOR}${randomSuffix}`;
};

/**
 * Extracts the base room name from a unique room identifier
 * @param uniqueRoomName - The unique room identifier
 * @returns string - The original base room name
 */
export const getBaseRoomName = (uniqueRoomName: string): string => {
  return uniqueRoomName.split(ROOM_NAME_SEPARATOR)[0];
};
