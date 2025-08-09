import { Timestamp } from 'firebase/firestore';

/**
 * Calculate streak count based on last streak date
 */
export const calculateStreak = (lastStreakDate: Timestamp | null, currentStreakCount: number): number => {
  if (!lastStreakDate) return 1; // First time logging

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = lastStreakDate.toDate();
  lastDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day, no change
    return currentStreakCount;
  } else if (daysDiff === 1) {
    // Next day, increment
    return currentStreakCount + 1;
  } else {
    // Streak broken, reset to 1
    return 1;
  }
};

/**
 * Check if user should get streak increment today
 */
export const shouldIncrementStreak = (lastStreakDate: Timestamp | null): boolean => {
  if (!lastStreakDate) return true; // First time logging

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = lastStreakDate.toDate();
  lastDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff >= 1;
};

/**
 * Get streak status message
 */
export const getStreakStatus = (streakCount: number, lastStreakDate: Timestamp | null): string => {
  if (streakCount === 0 || !lastStreakDate) {
    return 'Start your streak!';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = lastStreakDate.toDate();
  lastDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    return `${streakCount} day${streakCount === 1 ? '' : 's'} - Keep it up!`;
  } else if (daysDiff === 1) {
    return `${streakCount} day${streakCount === 1 ? '' : 's'} - Don't break it!`;
  } else {
    return 'Streak broken - Start fresh!';
  }
};

/**
 * Get flame height based on streak count (0-100 scale)
 */
export const getFlameHeight = (streakCount: number): number => {
  if (streakCount === 0) return 0;
  
  // Logarithmic scale for flame height
  // 1 day = 20%, 7 days = 50%, 30 days = 80%, 100+ days = 100%
  const height = Math.min(100, 20 + (Math.log(streakCount) / Math.log(100)) * 80);
  return Math.round(height);
};

/**
 * Format streak display text
 */
export const formatStreakDisplay = (streakCount: number): string => {
  if (streakCount === 0) return '0';
  if (streakCount === 1) return '1 Day';
  return `${streakCount} Days`;
};