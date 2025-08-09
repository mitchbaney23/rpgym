import { Timestamp } from 'firebase/firestore';

export type SkillName = 'pushups' | 'situps' | 'squats' | 'pullups' | '5k';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  overallLevel: number;
  streakCount: number;
  lastStreakDate: Timestamp | null;
  createdAt: Timestamp;
}

export interface Skill {
  id: SkillName;
  name: SkillName;
  level: number;
  best: number; // reps for exercises, seconds for 5k
  lastUpdated: Timestamp;
}

export interface PersonalRecord {
  id: string;
  skillId: SkillName;
  value: number;
  createdAt: Timestamp;
  delta: number; // improvement from previous best
}

export interface Badge {
  id: string;
  type: 'milestone' | 'season';
  label: string;
  skillId?: SkillName; // for milestone badges
  level?: number; // for milestone badges
  unlockedAt: Timestamp;
}

export interface LevelUpEvent {
  skillId: SkillName;
  newLevel: number;
  previousLevel: number;
}

// UI State types
export interface AppState {
  user: User | null;
  skills: Skill[];
  badges: Badge[];
  isLoading: boolean;
  error: string | null;
  levelUpEvent: LevelUpEvent | null;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  displayName: string;
}

export interface ResetPasswordForm {
  email: string;
}

export interface PRForm {
  skillId: SkillName;
  value: number;
}

// Constants
export const SKILLS: SkillName[] = ['pushups', 'situps', 'squats', 'pullups', '5k'];

export const MILESTONE_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 99];

export const SKILL_DISPLAY_NAMES: Record<SkillName, string> = {
  'pushups': 'Push-ups',
  'situps': 'Sit-ups',
  'squats': 'Squats',
  'pullups': 'Pull-ups',
  '5k': '5K Run',
};

export const SKILL_UNITS: Record<SkillName, string> = {
  'pushups': 'reps',
  'situps': 'reps',
  'squats': 'reps',
  'pullups': 'reps',
  '5k': 'time',
};