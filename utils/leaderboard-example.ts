/**
 * Example leaderboard implementation for RPGym competitions
 * 
 * This demonstrates how to create leaderboards using the calcOverallLevel function
 * and Firestore queries for real competitions between participants.
 */

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { calcOverallLevel } from './levels';
import type { LeaderboardEntry } from './leaderboard';

/**
 * Fetch leaderboard data from Firestore
 * Note: This would require adjusting Firestore rules to allow reading other users' data
 * or implementing via Cloud Functions for security
 */
export const fetchLeaderboard = async (limitCount: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    // Fetch all users and sort client-side to avoid needing complex indexes
    const usersQuery = query(
      collection(firestore, 'users'),
      orderBy('overallLevel', 'desc')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const realUsers: LeaderboardEntry[] = [];
    
    // Process each user document
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Get badges count for this user
      const badgesSnapshot = await getDocs(collection(firestore, 'users', userDoc.id, 'badges'));
      const totalBadges = badgesSnapshot.size;
      
      realUsers.push({
        uid: userDoc.id,
        displayName: userData.displayName || 'Anonymous',
        overallLevel: userData.overallLevel || 0,
        streakCount: userData.streakCount || 0,
        totalBadges,
        lastUpdated: userData.lastUpdated?.toDate() || new Date(),
      });
    }
    
    // Sort client-side and limit results
    realUsers.sort((a, b) => {
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
      return bBadges - aBadges;
    });
    
    // If we have real users, return them; otherwise fall back to mock data
    if (realUsers.length > 0) {
      return realUsers.slice(0, limitCount);
    }
    
    // Fallback to mock data if no real users exist yet
    return getMockLeaderboard().slice(0, limitCount);
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    // Fall back to mock data on error
    return getMockLeaderboard().slice(0, limitCount);
  }
};

/**
 * Example of how to use calcOverallLevel for real-time competition
 */
export const calculateUserRank = async (uid: string): Promise<{rank: number; total: number}> => {
  try {
    const leaderboard = await fetchLeaderboard(100); // Get top 100
    const userIndex = leaderboard.findIndex(entry => entry.uid === uid);
    
    return {
      rank: userIndex === -1 ? -1 : userIndex + 1,
      total: leaderboard.length
    };
  } catch (error) {
    console.error('Error calculating user rank:', error);
    return { rank: -1, total: 0 };
  }
};

/**
 * Mock leaderboard data for testing/demo purposes
 */
export const getMockLeaderboard = (): LeaderboardEntry[] => {
  return [
    {
      uid: 'user1',
      displayName: 'FitnessGuru42',
      overallLevel: 87,
      streakCount: 156,
      totalBadges: 35,
      lastUpdated: new Date(),
    },
    {
      uid: 'user2', 
      displayName: 'GymWarrior',
      overallLevel: 72,
      streakCount: 89,
      totalBadges: 28,
      lastUpdated: new Date(),
    },
    {
      uid: 'user3',
      displayName: 'CardioQueen',
      overallLevel: 65,
      streakCount: 234,
      totalBadges: 22,
      lastUpdated: new Date(),
    },
    {
      uid: 'user4',
      displayName: 'IronLifter',
      overallLevel: 58,
      streakCount: 67,
      totalBadges: 18,
      lastUpdated: new Date(),
    },
    {
      uid: 'user5',
      displayName: 'RunnerBoy',
      overallLevel: 52,
      streakCount: 145,
      totalBadges: 16,
      lastUpdated: new Date(),
    },
    {
      uid: 'user6',
      displayName: 'FlexMaster',
      overallLevel: 48,
      streakCount: 23,
      totalBadges: 12,
      lastUpdated: new Date(),
    },
    {
      uid: 'user7',
      displayName: 'FitnessFanatic',
      overallLevel: 42,
      streakCount: 78,
      totalBadges: 14,
      lastUpdated: new Date(),
    },
    {
      uid: 'user8',
      displayName: 'BodyBuilder99',
      overallLevel: 38,
      streakCount: 34,
      totalBadges: 9,
      lastUpdated: new Date(),
    },
    {
      uid: 'user9',
      displayName: 'ActiveAce',
      overallLevel: 35,
      streakCount: 56,
      totalBadges: 11,
      lastUpdated: new Date(),
    },
    {
      uid: 'user10',
      displayName: 'StrengthSeeker',
      overallLevel: 31,
      streakCount: 19,
      totalBadges: 7,
      lastUpdated: new Date(),
    },
    {
      uid: 'user11',
      displayName: 'SweatWarrior',
      overallLevel: 28,
      streakCount: 42,
      totalBadges: 8,
      lastUpdated: new Date(),
    },
    {
      uid: 'user12',
      displayName: 'MotivatedMover',
      overallLevel: 25,
      streakCount: 15,
      totalBadges: 5,
      lastUpdated: new Date(),
    }
  ];
};

/* 
FIRESTORE RULES NOTE:
To enable leaderboards, you would need to modify firestore.rules to allow 
reading limited user data for leaderboard purposes:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading basic user data for leaderboards
    match /users/{userId} {
      allow read: if request.auth != null && 
        request.auth.uid == userId;
      allow read: if request.auth != null && 
        resource.data.keys().hasOnly(['displayName', 'overallLevel', 'streakCount', 'lastUpdated']);
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // ... rest of rules
    }
  }
}

Alternatively, implement leaderboards via Cloud Functions for better security.
*/