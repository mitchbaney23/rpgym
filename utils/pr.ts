import { 
  ExerciseBlock, 
  PRResult, 
  SkillName, 
  Skill,
  XPBreakdown 
} from '../types/domain';
import { 
  calculateLevel, 
  calculateHybridLevel, 
  calculatePRBonusXP, 
  getXPForLevel 
} from './levels';
import { getSkill, updateSkill, updateUser, calculateAndGetOverallLevel } from '../lib/firestore';

/**
 * Maps exercise names to RPG skills for PR detection
 */
const EXERCISE_TO_SKILL_MAP: Record<string, SkillName> = {
  // Push-ups variations
  'push-ups': 'pushups',
  'pushups': 'pushups',
  'push up': 'pushups',
  'pushup': 'pushups',
  
  // Sit-ups variations
  'sit-ups': 'situps',
  'situps': 'situps',
  'sit up': 'situps',
  'situp': 'situps',
  'crunches': 'situps',
  'crunch': 'situps',
  
  // Squats variations
  'squats': 'squats',
  'squat': 'squats',
  'bodyweight squats': 'squats',
  'air squats': 'squats',
  
  // Pull-ups variations
  'pull-ups': 'pullups',
  'pullups': 'pullups',
  'pull up': 'pullups',
  'pullup': 'pullups',
  'chin-ups': 'pullups',
  'chinups': 'pullups',
  
  // 5K variations
  'running': '5k',
  'run': '5k',
  '5k': '5k',
  '5k run': '5k',
  'jog': '5k',
  'jogging': '5k',
};

/**
 * Detects which RPG skill an exercise maps to based on its name
 */
export const getSkillForExercise = (exerciseName: string): SkillName | null => {
  const normalized = exerciseName.toLowerCase().trim();
  return EXERCISE_TO_SKILL_MAP[normalized] || null;
};

/**
 * Extracts the best performance from an exercise block
 */
export const getBestPerformance = (exercise: ExerciseBlock): number | null => {
  switch (exercise.type) {
    case 'bodyweight':
      if (!exercise.bodyweightSets || exercise.bodyweightSets.length === 0) return null;
      return Math.max(...exercise.bodyweightSets.map(set => set.reps));
      
    case 'strength':
      // For strength exercises that map to bodyweight skills, use max reps
      const skill = getSkillForExercise(exercise.name);
      if (skill && skill !== '5k' && exercise.strengthSets && exercise.strengthSets.length > 0) {
        return Math.max(...exercise.strengthSets.map(set => set.reps));
      }
      return null;
      
    case 'endurance':
      if (!exercise.enduranceData) return null;
      return exercise.enduranceData.timeSec;
      
    default:
      return null;
  }
};

/**
 * Checks if a performance value is a PR for a given skill
 */
export const isPR = (skillValue: number, newValue: number, skillName: SkillName): boolean => {
  if (skillName === '5k') {
    // For 5K, lower time is better (only if we have a previous time)
    return skillValue > 0 && newValue < skillValue;
  } else {
    // For reps, higher is better
    return newValue > skillValue;
  }
};

/**
 * Detects PRs from workout exercises and returns PR results
 */
export const detectPRs = async (userId: string, exercises: ExerciseBlock[]): Promise<PRResult[]> => {
  const prResults: PRResult[] = [];
  
  for (const exercise of exercises) {
    const skillName = getSkillForExercise(exercise.name);
    if (!skillName) continue;
    
    const performance = getBestPerformance(exercise);
    if (performance === null || performance <= 0) continue;
    
    try {
      const currentSkill = await getSkill(userId, skillName);
      if (!currentSkill) continue;
      
      const isNewPR = isPR(currentSkill.best, performance, skillName);
      if (!isNewPR) continue;
      
      const levelBefore = currentSkill.level;
      const levelAfter = calculateLevel(skillName, performance);
      
      prResults.push({
        skillId: skillName,
        oldValue: currentSkill.best,
        newValue: performance,
        levelBefore,
        levelAfter,
        exerciseBlockId: exercise.id,
      });
      
    } catch (error) {
      console.error(`Error checking PR for skill ${skillName}:`, error);
    }
  }
  
  return prResults;
};

/**
 * Applies detected PRs to the user's skills and updates Firebase
 * Now includes bonus XP for PR achievements
 */
export const applyPRs = async (userId: string, prResults: PRResult[]): Promise<void> => {
  if (prResults.length === 0) return;
  
  // Update each skill with new PR and award bonus XP
  for (const pr of prResults) {
    try {
      const skill = await getSkill(userId, pr.skillId);
      if (!skill) continue;

      // Calculate bonus XP for level gain
      const bonusXP = calculatePRBonusXP(pr.levelBefore, pr.levelAfter);
      const currentXP = skill.xp || 0;
      const newXP = currentXP + bonusXP;

      // Calculate new hybrid level with updated XP
      const newLevel = calculateHybridLevel(pr.levelAfter, newXP);

      await updateSkill(userId, pr.skillId, {
        best: pr.newValue,
        level: newLevel,
        xp: newXP,
      });

      console.log(`PR achieved for ${pr.skillId}: ${pr.oldValue} -> ${pr.newValue} (Level ${pr.levelBefore} -> ${pr.levelAfter})`);
      console.log(`Awarded ${bonusXP} bonus XP: ${currentXP} -> ${newXP} (Final level: ${newLevel})`);
    } catch (error) {
      console.error(`Error updating skill ${pr.skillId}:`, error);
    }
  }
  
  // Recalculate and update overall level
  try {
    const newOverallLevel = await calculateAndGetOverallLevel(userId);
    console.log(`Updated overall level to ${newOverallLevel}`);
  } catch (error) {
    console.error('Error updating overall level:', error);
  }
};

/**
 * Main function: detects PRs and applies them to user's skills
 */
export const detectPRsAndApply = async (userId: string, exercises: ExerciseBlock[]): Promise<PRResult[]> => {
  const prResults = await detectPRs(userId, exercises);
  
  if (prResults.length > 0) {
    await applyPRs(userId, prResults);
  }
  
  return prResults;
};

/**
 * Calculates XP based on workout exercises
 */
export const calculateWorkoutXP = (exercises: ExerciseBlock[], prResults: PRResult[] = []): XPBreakdown => {
  let strengthXP = 0;
  let bodyweightXP = 0;
  let enduranceXP = 0;
  
  for (const exercise of exercises) {
    switch (exercise.type) {
      case 'strength':
        if (exercise.strengthSets) {
          // XP = sets * reps * weight / 10
          strengthXP += exercise.strengthSets.reduce((total, set) => 
            total + (set.reps * set.weight / 10), 0
          );
        }
        break;
        
      case 'bodyweight':
        if (exercise.bodyweightSets) {
          // XP = total reps * 2
          bodyweightXP += exercise.bodyweightSets.reduce((total, set) => 
            total + (set.reps * 2), 0
          );
        }
        break;
        
      case 'endurance':
        if (exercise.enduranceData) {
          // XP = distance * 50 + time in minutes * 5
          const distanceXP = (exercise.enduranceData.distanceKm || 0) * 50;
          const timeXP = (exercise.enduranceData.timeSec / 60) * 5;
          enduranceXP += distanceXP + timeXP;
        }
        break;
    }
  }
  
  // PR Bonus: 100 XP per level gained
  const prBonusXP = prResults.reduce((total, pr) => 
    total + ((pr.levelAfter - pr.levelBefore) * 100), 0
  );
  
  const totalXP = strengthXP + bodyweightXP + enduranceXP + prBonusXP;
  
  return {
    strengthXP: Math.round(strengthXP),
    bodyweightXP: Math.round(bodyweightXP),
    enduranceXP: Math.round(enduranceXP),
    prBonusXP: Math.round(prBonusXP),
    totalXP: Math.round(totalXP),
  };
};

/**
 * Checks if an exercise block would result in a PR (for real-time feedback)
 */
export const checkPotentialPR = async (
  userId: string, 
  exercise: ExerciseBlock
): Promise<{ isPR: boolean; levelGain: number; prValue: number } | null> => {
  const skillName = getSkillForExercise(exercise.name);
  if (!skillName) return null;
  
  const performance = getBestPerformance(exercise);
  if (performance === null || performance <= 0) return null;
  
  try {
    const currentSkill = await getSkill(userId, skillName);
    if (!currentSkill) return null;
    
    const wouldBePR = isPR(currentSkill.best, performance, skillName);
    if (!wouldBePR) return null;
    
    const currentLevel = currentSkill.level;
    const newLevel = calculateLevel(skillName, performance);
    const levelGain = newLevel - currentLevel;
    
    return {
      isPR: true,
      levelGain,
      prValue: performance,
    };
    
  } catch (error) {
    console.error(`Error checking potential PR for skill ${skillName}:`, error);
    return null;
  }
};

/**
 * Gets level preview for a potential performance value
 */
export const getLevelPreview = (skillName: SkillName, performance: number): number => {
  return calculateLevel(skillName, performance);
};

/**
 * Formats performance value for display
 */
export const formatPerformance = (value: number, skillName: SkillName): string => {
  if (skillName === '5k') {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return value.toString();
  }
};

// =============================================================================
// XP ALLOCATION SYSTEM
// =============================================================================

/**
 * Calculate XP to allocate to skills based on exercise type and mapping
 */
export const allocateWorkoutXP = (exercises: ExerciseBlock[]): Record<SkillName, number> => {
  const skillXP: Record<SkillName, number> = {
    pushups: 0,
    situps: 0,
    squats: 0,
    pullups: 0,
    '5k': 0,
  };

  for (const exercise of exercises) {
    const skillName = getSkillForExercise(exercise.name);
    if (!skillName) continue;

    let xpAmount = 0;

    switch (exercise.type) {
      case 'strength':
        if (exercise.strengthSets && skillName !== '5k') {
          // For strength exercises that map to bodyweight skills
          // XP = total reps across all sets
          xpAmount = exercise.strengthSets.reduce((total, set) => total + set.reps, 0);
        }
        break;

      case 'bodyweight':
        if (exercise.bodyweightSets && skillName !== '5k') {
          // XP = total reps across all sets
          xpAmount = exercise.bodyweightSets.reduce((total, set) => total + set.reps, 0);
        }
        break;

      case 'endurance':
        if (exercise.enduranceData && skillName === '5k') {
          // XP = distance * 20 + time in minutes * 2
          const distanceXP = (exercise.enduranceData.distanceKm || 0) * 20;
          const timeXP = (exercise.enduranceData.timeSec / 60) * 2;
          xpAmount = distanceXP + timeXP;
        }
        break;
    }

    skillXP[skillName] += Math.round(xpAmount);
  }

  return skillXP;
};

/**
 * Apply XP to skills and update their levels using hybrid system
 */
export const applyXPToSkills = async (userId: string, skillXP: Record<SkillName, number>): Promise<void> => {
  for (const [skillName, xpGain] of Object.entries(skillXP)) {
    if (xpGain <= 0) continue;

    try {
      const skill = await getSkill(userId, skillName as SkillName);
      if (!skill) continue;

      // Calculate new XP total
      const currentXP = skill.xp || 0;
      const newXP = currentXP + xpGain;

      // Calculate new hybrid level
      const prLevel = calculateLevel(skillName as SkillName, skill.best);
      const newLevel = calculateHybridLevel(prLevel, newXP);

      // Update skill with new XP and level
      await updateSkill(userId, skillName as SkillName, {
        xp: newXP,
        level: newLevel,
      });

      console.log(`Applied ${xpGain} XP to ${skillName}: ${currentXP} -> ${newXP} (Level ${skill.level} -> ${newLevel})`);
    } catch (error) {
      console.error(`Error applying XP to skill ${skillName}:`, error);
    }
  }
};

/**
 * Initialize skill XP based on current level (for backfill)
 */
export const initializeSkillXP = async (userId: string, skillName: SkillName): Promise<void> => {
  try {
    const skill = await getSkill(userId, skillName);
    if (!skill || skill.xp !== undefined) return; // Skip if XP already exists

    const requiredXP = getXPForLevel(skill.level);
    await updateSkill(userId, skillName, {
      xp: requiredXP,
    });

    console.log(`Initialized ${skillName} XP to ${requiredXP} for level ${skill.level}`);
  } catch (error) {
    console.error(`Error initializing XP for skill ${skillName}:`, error);
  }
};

/**
 * Backfill XP for all skills based on current levels
 */
export const backfillAllSkillsXP = async (userId: string): Promise<void> => {
  const skillNames: SkillName[] = ['pushups', 'situps', 'squats', 'pullups', '5k'];
  
  for (const skillName of skillNames) {
    await initializeSkillXP(userId, skillName);
  }
};