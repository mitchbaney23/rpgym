import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { 
  User, 
  Skill, 
  PersonalRecord, 
  Badge, 
  SkillName, 
  SKILLS,
  WorkoutSession,
  WorkoutTemplate 
} from '../types/domain';
import { calculateLevel } from '../utils/levels';

// User operations
export const createUser = async (uid: string, email: string, displayName: string) => {
  const userData: Omit<User, 'uid'> = {
    displayName,
    email,
    overallLevel: 0,
    streakCount: 0,
    lastStreakDate: null,
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(doc(firestore, 'users', uid), userData);
  
  // Initialize skills for new user
  const skillPromises = SKILLS.map(skillName => 
    initializeSkill(uid, skillName)
  );
  
  await Promise.all(skillPromises);
  
  return { ...userData, uid };
};

export const getUser = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(firestore, 'users', uid));
  if (!userDoc.exists()) return null;
  
  return { uid, ...userDoc.data() } as User;
};

export const updateUser = async (uid: string, userData: Partial<Omit<User, 'uid'>>) => {
  await updateDoc(doc(firestore, 'users', uid), userData);
};

// Skill operations
export const initializeSkill = async (uid: string, skillName: SkillName) => {
  const skillData: Omit<Skill, 'id'> = {
    name: skillName,
    level: 0,
    best: skillName === '5k' ? 3600 : 0, // 5k starts at 60 minutes (3600 seconds)
    lastUpdated: serverTimestamp() as Timestamp,
  };

  await setDoc(doc(firestore, 'users', uid, 'skills', skillName), skillData);
};

export const getSkills = async (uid: string): Promise<Skill[]> => {
  const skillsSnapshot = await getDocs(collection(firestore, 'users', uid, 'skills'));
  const skills = skillsSnapshot.docs.map(doc => ({
    id: doc.id as SkillName,
    ...doc.data()
  })) as Skill[];

  // If no skills found, initialize them
  if (skills.length === 0) {
    console.log('No skills found, initializing...');
    const skillPromises = SKILLS.map(skillName => initializeSkill(uid, skillName));
    await Promise.all(skillPromises);
    
    // Fetch again after initialization
    const newSkillsSnapshot = await getDocs(collection(firestore, 'users', uid, 'skills'));
    return newSkillsSnapshot.docs.map(doc => ({
      id: doc.id as SkillName,
      ...doc.data()
    })) as Skill[];
  }

  return skills;
};

export const getSkill = async (uid: string, skillId: SkillName): Promise<Skill | null> => {
  const skillDoc = await getDoc(doc(firestore, 'users', uid, 'skills', skillId));
  if (!skillDoc.exists()) return null;
  
  return { id: skillId, ...skillDoc.data() } as Skill;
};

export const updateSkill = async (uid: string, skillId: SkillName, skillData: Partial<Omit<Skill, 'id'>>) => {
  await updateDoc(doc(firestore, 'users', uid, 'skills', skillId), {
    ...skillData,
    lastUpdated: serverTimestamp(),
  });
};

// PR operations
export const logPersonalRecord = async (
  uid: string, 
  skillId: SkillName, 
  value: number
): Promise<{ levelUp: boolean; newLevel: number; badge?: Badge }> => {
  // Get current skill data
  const currentSkill = await getSkill(uid, skillId);
  if (!currentSkill) throw new Error('Skill not found');

  const delta = value - currentSkill.best;
  const newLevel = calculateLevel(skillId, value);
  const levelUp = newLevel > currentSkill.level;

  // Create PR record
  const prData: Omit<PersonalRecord, 'id'> = {
    skillId,
    value,
    delta,
    createdAt: serverTimestamp() as Timestamp,
  };

  await addDoc(collection(firestore, 'users', uid, 'prs'), prData);

  // Update skill
  await updateSkill(uid, skillId, {
    best: Math.max(currentSkill.best, value),
    level: newLevel,
  });

  // Update overall level
  await updateOverallLevel(uid);

  // Check for badge unlock
  let badge: Badge | undefined;
  if (levelUp && [10, 20, 30, 40, 50, 60, 70, 80, 90, 99].includes(newLevel)) {
    badge = await unlockMilestoneBadge(uid, skillId, newLevel);
  }

  return { levelUp, newLevel, badge };
};

export const getPersonalRecords = async (uid: string, skillId?: SkillName, limitCount?: number) => {
  let q = query(
    collection(firestore, 'users', uid, 'prs'),
    orderBy('createdAt', 'desc')
  );

  if (skillId) {
    q = query(q, where('skillId', '==', skillId));
  }

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as PersonalRecord[];
};

// Badge operations
export const unlockMilestoneBadge = async (uid: string, skillId: SkillName, level: number): Promise<Badge> => {
  const badgeData: Omit<Badge, 'id'> = {
    type: 'milestone',
    label: level === 99 ? `${skillId.toUpperCase()} L99—Golden` : `${skillId.toUpperCase()} L${level}`,
    skillId,
    level,
    unlockedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(firestore, 'users', uid, 'badges'), badgeData);
  
  return { id: docRef.id, ...badgeData } as Badge;
};

export const getBadges = async (uid: string): Promise<Badge[]> => {
  const badgesSnapshot = await getDocs(
    query(collection(firestore, 'users', uid, 'badges'), orderBy('unlockedAt', 'desc'))
  );
  
  return badgesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Badge[];
};

// Helper function to update overall level
const updateOverallLevel = async (uid: string) => {
  const skills = await getSkills(uid);
  const overallLevel = Math.round(
    skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length
  );
  
  await updateUser(uid, { overallLevel });
  return overallLevel;
};

// Export function to get overall level for leaderboards
export const calculateAndGetOverallLevel = async (uid: string): Promise<number> => {
  return await updateOverallLevel(uid);
};

// Streak operations
export const updateStreak = async (uid: string) => {
  const user = await getUser(uid);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastStreakDate = user.lastStreakDate?.toDate();
  
  let newStreakCount = user.streakCount;
  
  if (!lastStreakDate) {
    // First time logging
    newStreakCount = 1;
  } else {
    const lastStreakDateNormalized = new Date(lastStreakDate);
    lastStreakDateNormalized.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastStreakDateNormalized.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no change to streak
      return;
    } else if (daysDiff === 1) {
      // Next day, increment streak
      newStreakCount += 1;
    } else {
      // Streak broken, reset to 1
      newStreakCount = 1;
    }
  }

  await updateUser(uid, {
    streakCount: newStreakCount,
    lastStreakDate: Timestamp.fromDate(today),
  });
};

// Workout operations
export const saveWorkoutSession = async (
  uid: string, 
  workout: Omit<WorkoutSession, 'id'>
): Promise<WorkoutSession> => {
  const docRef = await addDoc(collection(firestore, 'users', uid, 'workouts'), {
    ...workout,
    createdAt: serverTimestamp(),
  });
  
  return { id: docRef.id, ...workout } as WorkoutSession;
};

export const getWorkoutSessions = async (
  uid: string, 
  limitCount?: number
): Promise<WorkoutSession[]> => {
  let q = query(
    collection(firestore, 'users', uid, 'workouts'),
    orderBy('date', 'desc')
  );

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as WorkoutSession[];
};

export const getWorkoutSession = async (
  uid: string, 
  workoutId: string
): Promise<WorkoutSession | null> => {
  const workoutDoc = await getDoc(doc(firestore, 'users', uid, 'workouts', workoutId));
  if (!workoutDoc.exists()) return null;
  
  return { id: workoutId, ...workoutDoc.data() } as WorkoutSession;
};

export const updateWorkoutSession = async (
  uid: string, 
  workoutId: string, 
  updates: Partial<Omit<WorkoutSession, 'id'>>
) => {
  await updateDoc(doc(firestore, 'users', uid, 'workouts', workoutId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteWorkoutSession = async (uid: string, workoutId: string) => {
  // Note: Firebase doesn't have a delete function in the imported functions
  // You'll need to import deleteDoc separately if needed
  console.warn('Delete workout not implemented - requires deleteDoc import');
};

// Workout template operations
export const saveWorkoutTemplate = async (
  uid: string, 
  template: Omit<WorkoutTemplate, 'id'>
): Promise<WorkoutTemplate> => {
  const docRef = await addDoc(collection(firestore, 'users', uid, 'templates'), {
    ...template,
    createdAt: serverTimestamp(),
  });
  
  return { id: docRef.id, ...template } as WorkoutTemplate;
};

export const getWorkoutTemplates = async (uid: string): Promise<WorkoutTemplate[]> => {
  const q = query(
    collection(firestore, 'users', uid, 'templates'),
    orderBy('lastUsed', 'desc'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as WorkoutTemplate[];
};

export const updateWorkoutTemplate = async (
  uid: string, 
  templateId: string, 
  updates: Partial<Omit<WorkoutTemplate, 'id'>>
) => {
  await updateDoc(doc(firestore, 'users', uid, 'templates', templateId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const markTemplateAsUsed = async (uid: string, templateId: string) => {
  await updateDoc(doc(firestore, 'users', uid, 'templates', templateId), {
    lastUsed: serverTimestamp(),
  });
};