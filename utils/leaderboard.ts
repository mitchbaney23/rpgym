import { User } from '../types/domain';

/**
 * Calculate overall level from skills array (matches your specification)
 */
export const calcOverallLevel = (skills: Array<{level: number}>): number => {
  if (skills.length === 0) return 0;
  return Math.round(
    skills.reduce((sum, s) => sum + s.level, 0) / skills.length
  );
};

/**
 * Leaderboard entry type for competition features
 */
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  overallLevel: number;
  streakCount: number;
  totalBadges?: number;
  lastUpdated: Date;
}

/**
 * Sort users by overall level for leaderboard
 */
export const sortByOverallLevel = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
  return entries.sort((a, b) => {
    // Primary sort: Overall Level (descending)
    if (b.overallLevel !== a.overallLevel) {
      return b.overallLevel - a.overallLevel;
    }
    
    // Secondary sort: Streak Count (descending)
    if (b.streakCount !== a.streakCount) {
      return b.streakCount - a.streakCount;
    }
    
    // Tertiary sort: Total Badges (descending)
    const aBadges = a.totalBadges || 0;
    const bBadges = b.totalBadges || 0;
    if (bBadges !== aBadges) {
      return bBadges - aBadges;
    }
    
    // Final sort: Most recently updated (descending)
    return b.lastUpdated.getTime() - a.lastUpdated.getTime();
  });
};

/**
 * Get user's rank in leaderboard (1-based)
 */
export const getUserRank = (entries: LeaderboardEntry[], uid: string): number => {
  const sortedEntries = sortByOverallLevel(entries);
  const userIndex = sortedEntries.findIndex(entry => entry.uid === uid);
  return userIndex === -1 ? -1 : userIndex + 1;
};

/**
 * Get top N users for leaderboard display
 */
export const getTopUsers = (entries: LeaderboardEntry[], count: number = 10): LeaderboardEntry[] => {
  return sortByOverallLevel(entries).slice(0, count);
};

/**
 * Format level for display with suffix
 */
export const formatLevelDisplay = (level: number): string => {
  if (level === 0) return 'Novice';
  if (level >= 90) return `L${level} 👑`; // Elite levels
  if (level >= 50) return `L${level} ⭐`; // Advanced levels  
  if (level >= 20) return `L${level} 🔥`; // Intermediate levels
  return `L${level}`;                      // Beginner levels
};