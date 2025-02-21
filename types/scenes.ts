// types/scenes.ts

export interface Scene {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  roomName: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'social' | 'dating' | 'networking';
  isLocked?: boolean;
}

export const mockScenes: Scene[] = [
  {
    id: '1',
    title: "Pizza at Lucali's",
    description: 'The girl behind you in line looks cold, but seems like she wants to talk to you.',
    roomName: 'NY-snow-pizza',
    difficulty: 'beginner',
    category: 'social',
    imageUrl: 'pizza-scene.jpg',
  },
  {
    id: '2',
    title: 'Comedy Store',
    description: 'Give up your seat so she can enjoy the Comedy Store.',
    roomName: 'LA-comedy-night',
    difficulty: 'beginner',
    category: 'social',
    imageUrl: 'Comedy-clubs-los-angeles_The-Comedy-Store.jpg',
    isLocked: true,
  },
  {
    id: '3',
    title: 'Super Bowl Snacks',
    description: 'Help her pick snacks for Super Bowl Sunday.',
    roomName: 'superbowl-sunday-snacks',
    difficulty: 'beginner',
    category: 'dating',
    imageUrl: 'young-woman-supermarket-buying_432566-2544.jpg',
    isLocked: true,
  },
];
