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

// Mock data
export const mockScenes: Scene[] = [
  {
    id: '1',
    title: 'Pizza at Lucali’s',
    description: 'Offer her your scarf to keep warm outside Lucali’s.',
    roomName: 'NY-snow-pizza',
    difficulty: 'beginner',
    category: 'social',
    imageUrl: 'lucali.jpg',
  },
  {
    id: '2',
    title: 'Comedy Store',
    description: 'Give up your seat so she can enjoy the Comedy Store.',
    roomName: 'LA-comedy-night',
    difficulty: 'beginner',
    category: 'social',
    imageUrl: 'Comedy-clubs-los-angeles_The-Comedy-Store.jpg',
  },
  {
    id: '3',
    title: 'Super Bowl Snacks',
    description: 'Help her pick snacks for Super Bowl Sunday.',
    roomName: 'superbowl-sunday-snacks',
    difficulty: 'beginner',
    category: 'dating',
    imageUrl: 'young-woman-supermarket-buying_432566-2544.jpg',
  },
  {
    id: '4',
    title: 'Walking the Strand',
    description: 'Give her back the Dodgers hat she dropped.',
    roomName: 'walking-the-strand',
    difficulty: 'intermediate',
    category: 'social',
    imageUrl: 'santa-monica-beach-path.jpg',
    isLocked: true,
  },
  {
    id: '5',
    title: 'Art Gallery Opening',
    description: 'Discuss art and culture in an sophisticated setting.',
    roomName: 'art-gallery',
    difficulty: 'intermediate',
    category: 'dating',
    imageUrl: '/api/placeholder/400/300',
    isLocked: true,
  },
  {
    id: '6',
    title: 'Networking Event',
    description: 'Build professional relationships with confidence.',
    roomName: 'networking',
    difficulty: 'advanced',
    category: 'networking',
    imageUrl: '/api/placeholder/400/300',
    isLocked: true,
  },
  {
    id: '7',
    title: 'Dog Park Encounter',
    description: 'Connect with fellow pet lovers naturally.',
    roomName: 'dog-park',
    difficulty: 'beginner',
    category: 'social',
    imageUrl: '/api/placeholder/400/300',
    isLocked: true,
  },
  {
    id: '8',
    title: 'Farmers Market',
    description: 'Practice casual conversations while shopping local.',
    roomName: 'farmers-market',
    difficulty: 'intermediate',
    category: 'social',
    imageUrl: '/api/placeholder/400/300',
    isLocked: true,
  },
  {
    id: '9',
    title: 'Yoga Class',
    description: 'Connect with others interested in wellness.',
    roomName: 'yoga-class',
    difficulty: 'intermediate',
    category: 'social',
    imageUrl: '/api/placeholder/400/300',
    isLocked: true,
  },
  {
    id: '10',
    title: 'Tech Meetup',
    description: 'Navigate professional networking in the tech industry.',
    roomName: 'tech-meetup',
    difficulty: 'advanced',
    category: 'networking',
    imageUrl: '/api/placeholder/400/300',
    isLocked: true,
  },
];
