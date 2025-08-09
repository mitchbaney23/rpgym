import { SkillName } from '../types/domain';

/**
 * Calculate level based on skill type and best performance
 * Level math (deterministic):
 * - pushups/situps/squats: level = min(99, best)
 * - pullups: level = min(99, best * 5)
 * - 5k: store bestSeconds; level = clamp(floor((3600 - bestSeconds) / 21), 0, 99)
 */
export const calculateLevel = (skillId: SkillName, best: number): number => {
  switch (skillId) {
    case 'pushups':
    case 'situps':
    case 'squats':
      return Math.min(99, Math.floor(best));
    
    case 'pullups':
      return Math.min(99, Math.floor(best * 5));
    
    case '5k':
      // For 5k, best is stored in seconds
      // Level formula: clamp(floor((3600 - bestSeconds) / 21), 0, 99)
      // This means 60 minutes (3600s) = level 0, and each 21 seconds improvement = +1 level
      return Math.max(0, Math.min(99, Math.floor((3600 - best) / 21)));
    
    default:
      return 0;
  }
};

/**
 * Calculate the target performance needed to reach the next level
 */
export const getNextLevelTarget = (skillId: SkillName, currentLevel: number): number => {
  if (currentLevel >= 99) return 0; // Max level reached

  const nextLevel = currentLevel + 1;
  
  switch (skillId) {
    case 'pushups':
    case 'situps':
    case 'squats':
      return nextLevel;
    
    case 'pullups':
      // If level = best * 5, then best = level / 5
      return Math.ceil(nextLevel / 5);
    
    case '5k':
      // If level = floor((3600 - bestSeconds) / 21), then bestSeconds = 3600 - (level * 21)
      return 3600 - (nextLevel * 21);
    
    default:
      return 0;
  }
};

/**
 * Format time in seconds to MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Convert MM:SS format to seconds
 */
export const parseTime = (timeString: string): number => {
  const parts = timeString.split(':');
  if (parts.length !== 2) return 0;
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds)) return 0;
  
  return minutes * 60 + seconds;
};

/**
 * Get performance improvement description
 */
export const getImprovementText = (skillId: SkillName, oldValue: number, newValue: number): string => {
  const delta = newValue - oldValue;
  
  if (delta <= 0) return '';
  
  switch (skillId) {
    case 'pushups':
    case 'situps':
    case 'squats':
    case 'pullups':
      return `+${delta} reps`;
    
    case '5k':
      const timeDelta = Math.abs(delta); // For 5k, improvement means lower time
      const minutes = Math.floor(timeDelta / 60);
      const seconds = timeDelta % 60;
      if (minutes > 0) {
        return `-${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return `-${seconds}s`;
    
    default:
      return '';
  }
};

/**
 * Get the display value for a skill performance
 */
export const getDisplayValue = (skillId: SkillName, value: number): string => {
  switch (skillId) {
    case 'pushups':
    case 'situps':
    case 'squats':
    case 'pullups':
      return value.toString();
    
    case '5k':
      return formatTime(value);
    
    default:
      return value.toString();
  }
};

/**
 * Calculate overall level from all skills
 */
export const calculateOverallLevel = (skillLevels: number[]): number => {
  if (skillLevels.length === 0) return 0;
  const average = skillLevels.reduce((sum, level) => sum + level, 0) / skillLevels.length;
  return Math.round(average);
};

/**
 * Alternative function matching your exact specification for leaderboards
 */
export const calcOverallLevel = (skills: Array<{level: number}>): number => {
  if (skills.length === 0) return 0;
  return Math.round(
    skills.reduce((sum, s) => sum + s.level, 0) / skills.length
  );
};