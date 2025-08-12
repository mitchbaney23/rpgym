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

// =============================================================================
// XP CURVE SYSTEM
// =============================================================================

/**
 * Tunable constants for hybrid XP + PR leveling system
 */
export const XP_CONFIG = {
  SOFT_CAP_BUFFER: 3,        // levels above PR before diminishing returns
  OVERCAP_PENALTY: 0.5,      // XP efficiency above the soft cap (50% efficiency)
  BASE_XP: 100,              // XP required for level 1
  XP_PER_LEVEL: 25,          // Additional XP per level (Level 1 = 100, Level 2 = 125, etc.)
};

/**
 * Calculate total XP required to reach a specific level
 * Level 1 = 100 XP, Level 2 = 125 XP, Level 3 = 150 XP, etc.
 * Formula: XP = level * (BASE_XP + (level - 1) * XP_PER_LEVEL / 2)
 */
export const getXPForLevel = (level: number): number => {
  if (level <= 0) return 0;
  if (level >= 99) level = 99; // Cap at level 99
  
  // Arithmetic progression sum: level * (first_term + last_term) / 2
  const firstTerm = XP_CONFIG.BASE_XP;
  const lastTerm = XP_CONFIG.BASE_XP + (level - 1) * XP_CONFIG.XP_PER_LEVEL;
  return Math.round(level * (firstTerm + lastTerm) / 2);
};

/**
 * Calculate level from total XP using the XP curve
 */
export const getLevelFromXP = (totalXP: number): number => {
  if (totalXP <= 0) return 0;
  
  // Binary search to find the level
  let low = 0;
  let high = 99;
  
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    const requiredXP = getXPForLevel(mid);
    
    if (totalXP >= requiredXP) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  
  return low;
};

/**
 * Calculate XP needed for the next level
 */
export const getXPToNextLevel = (currentXP: number): number => {
  const currentLevel = getLevelFromXP(currentXP);
  if (currentLevel >= 99) return 0; // Max level reached
  
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return nextLevelXP - currentXP;
};

/**
 * Calculate progress within current level (0.0 to 1.0)
 */
export const getLevelProgress = (currentXP: number): number => {
  const currentLevel = getLevelFromXP(currentXP);
  if (currentLevel >= 99) return 1.0; // Max level
  if (currentLevel === 0) return 0.0; // No XP yet
  
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const progressXP = currentXP - currentLevelXP;
  const totalLevelXP = nextLevelXP - currentLevelXP;
  
  return Math.max(0, Math.min(1, progressXP / totalLevelXP));
};

/**
 * Calculate effective skill level combining PR level and XP level with soft cap
 */
export const calculateHybridLevel = (prLevel: number, currentXP: number): number => {
  const xpLevel = getLevelFromXP(currentXP);
  const softCap = prLevel + XP_CONFIG.SOFT_CAP_BUFFER;
  
  if (xpLevel <= softCap) {
    // Below soft cap: use XP level directly
    return Math.min(xpLevel, 99);
  } else {
    // Above soft cap: apply diminishing returns
    const overCapLevels = xpLevel - softCap;
    const penalizedLevels = overCapLevels * XP_CONFIG.OVERCAP_PENALTY;
    return Math.min(softCap + penalizedLevels, 99);
  }
};

/**
 * Calculate bonus XP for PR level gains
 * Awards 100 XP per level gained from PR improvement
 */
export const calculatePRBonusXP = (levelBefore: number, levelAfter: number): number => {
  const levelsGained = Math.max(0, levelAfter - levelBefore);
  return levelsGained * 100;
};