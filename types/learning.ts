// types/learning.ts

export type NodeType =
  | 'tutorial'
  | 'setup'
  | 'lesson'
  | 'checkpoint'
  | 'challenge'
  | 'achievement'
  | 'profile';

// New content page types
export type LessonContentType = 'voice' | 'text' | 'listening' | 'image';

export interface BaseLessonPage {
  id: string;
  type: LessonContentType;
  title?: string;
}

export interface VoiceLessonPage extends BaseLessonPage {
  type: 'voice';
  prompt: string;
  expectedResponse?: string;
  feedback?: {
    correct: string;
    incorrect: string;
  };
}

export interface TextLessonPage extends BaseLessonPage {
  type: 'text';
  content: string;
  style?: 'normal' | 'quote' | 'highlight' | 'warning';
}

export interface ListeningLessonPage extends BaseLessonPage {
  type: 'listening';
  audioUrl: string;
  transcript?: string;
  duration: number;
}

export interface ImageLessonPage extends BaseLessonPage {
  type: 'image';
  imageUrl: string;
  caption?: string;
  altText: string;
}

export type LessonPage = VoiceLessonPage | TextLessonPage | ListeningLessonPage | ImageLessonPage;

export interface Question {
  text?: string;
  type?:
    | 'voice-yes-no'
    | 'multiple-choice'
    | 'text'
    | 'voice-input'
    | 'multiple-select'
    | 'single-select';
  category?: string;
  prompt?: string;
  options?: string[];
  fields?: ProfileField[];
}

export interface ProfileField {
  name: string;
  type: 'select' | 'number' | 'text';
  required: boolean;
}

export interface Scenario {
  character?: string;
  context?: string;
  setting?: string;
  interests?: string[];
  situation?: string;
  cues?: string[];
}

export interface Challenge {
  objective: string;
  suggestions: string[];
  reflection?: {
    questions: string[];
  };
}

export interface Reward {
  xp: number;
  badge?: string;
}

export interface Practice {
  prompt: string;
  topics: string[];
}

export interface NodeContent {
  mainText: string;
  voicePrompt?: string;
  questions?: Question[];
  permissions?: string[];
  features?: string[];
  successCriteria?: string[];
  scenarios?: Scenario[];
  scenario?: Scenario;
  examples?: string[];
  reward?: Reward;
  unlocks?: string;
  practice?: Practice;
  challenge?: Challenge;
  // New field for lesson pages
  pages?: LessonPage[];
}

export interface LearningNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  content: NodeContent;
  requirements: string[];
  xpReward: number;
  isCompleted?: boolean;
  isLocked?: boolean;
}

export interface LearningSection {
  id: string;
  title: string;
  description: string;
  nodes: LearningNode[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpValue: number;
  isUnlocked?: boolean;
}

export interface LearningPath {
  version: string;
  title: string;
  description: string;
  sections: LearningSection[];
  achievements: Record<string, Achievement>;
  xpLevels: Record<number, number>;
}

export interface UserProgress {
  currentXP: number;
  level: number;
  completedNodes: string[];
  unlockedAchievements: string[];
  currentNode?: string;
}
