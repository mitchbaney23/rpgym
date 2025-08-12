import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkillName } from '../types/domain';

/**
 * Recent exercise data structure
 */
export interface RecentExercise {
  name: string;
  skillId: SkillName;
  category?: string;
  lastUsed: string; // ISO date string
  useCount: number;
}

/**
 * Default exercises for new users
 */
const DEFAULT_EXERCISES: RecentExercise[] = [
  {
    name: 'Push-ups',
    skillId: 'pushups',
    lastUsed: new Date().toISOString(),
    useCount: 0,
  },
  {
    name: 'Pull-ups',
    skillId: 'pullups',
    lastUsed: new Date().toISOString(),
    useCount: 0,
  },
  {
    name: 'Squats',
    skillId: 'squats',
    lastUsed: new Date().toISOString(),
    useCount: 0,
  },
  {
    name: '5K Run',
    skillId: '5k',
    lastUsed: new Date().toISOString(),
    useCount: 0,
  },
];

const STORAGE_KEY = 'recent_exercises';
const MAX_RECENT_EXERCISES = 20;

/**
 * Get recent exercises for quick-add chips
 * Returns top 6 most frequently used exercises
 */
export const getRecentExercises = async (): Promise<RecentExercise[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_EXERCISES.slice(0, 6);
    }
    
    const exercises: RecentExercise[] = JSON.parse(stored);
    
    // Sort by use count (descending) then by last used (most recent first)
    const sorted = exercises.sort((a, b) => {
      if (a.useCount !== b.useCount) {
        return b.useCount - a.useCount;
      }
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    });
    
    return sorted.slice(0, 6);
  } catch (error) {
    console.error('Error loading recent exercises:', error);
    return DEFAULT_EXERCISES.slice(0, 6);
  }
};

/**
 * Add or update an exercise in recent exercises
 */
export const addRecentExercise = async (exercise: Omit<RecentExercise, 'lastUsed' | 'useCount'>): Promise<void> => {
  try {
    const existing = await getStoredExercises();
    const now = new Date().toISOString();
    
    // Find existing exercise by name (case insensitive)
    const existingIndex = existing.findIndex(
      e => e.name.toLowerCase() === exercise.name.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // Update existing exercise
      existing[existingIndex] = {
        ...existing[existingIndex],
        ...exercise,
        lastUsed: now,
        useCount: existing[existingIndex].useCount + 1,
      };
    } else {
      // Add new exercise
      existing.push({
        ...exercise,
        lastUsed: now,
        useCount: 1,
      });
    }
    
    // Keep only the most recent MAX_RECENT_EXERCISES
    const trimmed = existing
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, MAX_RECENT_EXERCISES);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving recent exercise:', error);
  }
};

/**
 * Get the last used skill for default selection
 */
export const getLastUsedSkill = async (): Promise<SkillName> => {
  try {
    const exercises = await getStoredExercises();
    if (exercises.length === 0) return 'pushups';
    
    // Return skill of most recently used exercise
    const mostRecent = exercises.reduce((latest, current) => 
      new Date(current.lastUsed) > new Date(latest.lastUsed) ? current : latest
    );
    
    return mostRecent.skillId;
  } catch (error) {
    console.error('Error getting last used skill:', error);
    return 'pushups';
  }
};

/**
 * Search exercises by name (for custom exercise dialog)
 */
export const searchExercises = async (query: string): Promise<RecentExercise[]> => {
  try {
    const exercises = await getStoredExercises();
    const lowercaseQuery = query.toLowerCase().trim();
    
    if (!lowercaseQuery) return [];
    
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    console.error('Error searching exercises:', error);
    return [];
  }
};

/**
 * Get all stored exercises (internal helper)
 */
const getStoredExercises = async (): Promise<RecentExercise[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with defaults
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXERCISES));
      return DEFAULT_EXERCISES;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading stored exercises:', error);
    return DEFAULT_EXERCISES;
  }
};

/**
 * Clear all recent exercises (for testing/reset)
 */
export const clearRecentExercises = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recent exercises:', error);
  }
};