import { create } from 'zustand';
import { User, Skill, Badge, LevelUpEvent } from '../types/domain';
import { onAuthStateChange } from './auth';
import { getUser, getSkills, getBadges } from './firestore';

interface AppStore {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // App data
  skills: Skill[];
  badges: Badge[];
  
  // UI state
  levelUpEvent: LevelUpEvent | null;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSkills: (skills: Skill[]) => void;
  setBadges: (badges: Badge[]) => void;
  setLevelUpEvent: (event: LevelUpEvent | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  loadUserData: () => Promise<void>;
  clearStore: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  skills: [],
  badges: [],
  levelUpEvent: null,
  error: null,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSkills: (skills) => set({ skills }),
  setBadges: (badges) => set({ badges }),
  setLevelUpEvent: (levelUpEvent) => set({ levelUpEvent }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
  
  loadUserData: async () => {
    const { user } = get();
    if (!user?.uid) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const [userData, skills, badges] = await Promise.all([
        getUser(user.uid),
        getSkills(user.uid),
        getBadges(user.uid),
      ]);
      
      if (userData) {
        set({ user: userData });
      }
      
      set({ skills, badges });
    } catch (error) {
      console.error('Error loading user data:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearStore: () => set({
    user: null,
    isAuthenticated: false,
    skills: [],
    badges: [],
    levelUpEvent: null,
    error: null,
    isLoading: false,
  }),
}));

// Initialize auth listener
let authUnsubscribe: (() => void) | null = null;

export const initializeAuth = () => {
  if (authUnsubscribe) return; // Already initialized
  
  authUnsubscribe = onAuthStateChange(async (firebaseUser) => {
    const { setUser, loadUserData, clearStore } = useAppStore.getState();
    
    if (firebaseUser) {
      // Convert Firebase user to our User type
      const user: User = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        overallLevel: 0,
        streakCount: 0,
        lastStreakDate: null,
        createdAt: null as any, // Will be loaded from Firestore
      };
      
      setUser(user);
      await loadUserData();
    } else {
      setUser(null);
      clearStore();
    }
  });
};

export const cleanupAuth = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
};