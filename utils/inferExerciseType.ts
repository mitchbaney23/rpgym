import { ExerciseType, SkillName } from '../types/domain';

/**
 * Simplified workout data for type inference
 */
export interface SimpleWorkoutData {
  exerciseName: string;
  reps?: number;
  weight?: number;
  distance?: number;
  timeSeconds?: number;
}

/**
 * Infer exercise type from input data
 * Priority: endurance (if distance/time) > strength (if weight) > bodyweight (if reps) > invalid
 */
export const inferExerciseType = (data: SimpleWorkoutData): ExerciseType | null => {
  const { reps = 0, weight = 0, distance = 0, timeSeconds = 0 } = data;
  
  // Endurance: has distance or time
  if (distance > 0 || timeSeconds > 0) {
    return 'endurance';
  }
  
  // Strength: has weight and reps
  if (weight > 0 && reps > 0) {
    return 'strength';
  }
  
  // Bodyweight: has reps but no weight
  if (reps > 0 && weight === 0) {
    return 'bodyweight';
  }
  
  // Invalid: no meaningful data
  return null;
};

/**
 * Validate workout data based on inferred type
 */
export const validateWorkoutData = (data: SimpleWorkoutData): boolean => {
  const type = inferExerciseType(data);
  if (!type) return false;
  
  const { reps = 0, weight = 0, distance = 0, timeSeconds = 0 } = data;
  
  switch (type) {
    case 'bodyweight':
      return reps >= 1;
    
    case 'strength':
      return weight >= 1 && reps >= 1;
    
    case 'endurance':
      return distance >= 0.1 && timeSeconds >= 60;
    
    default:
      return false;
  }
};

/**
 * Infer skill from exercise name and type
 */
export const inferSkillFromExercise = (exerciseName: string, exerciseType: ExerciseType): SkillName => {
  const normalized = exerciseName.toLowerCase().trim();
  
  // Direct skill mapping (reuse existing logic)
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
  
  const mappedSkill = EXERCISE_TO_SKILL_MAP[normalized];
  if (mappedSkill) return mappedSkill;
  
  // Fallback by exercise type
  switch (exerciseType) {
    case 'bodyweight':
      return 'pushups'; // Default bodyweight skill
    case 'strength':
      return 'squats'; // Default strength skill
    case 'endurance':
      return '5k'; // Default endurance skill
    default:
      return 'pushups';
  }
};

/**
 * Calculate estimated XP for preview (simplified version)
 */
export const calculateEstimatedXP = (data: SimpleWorkoutData): number => {
  const type = inferExerciseType(data);
  if (!type) return 0;
  
  const { reps = 0, weight = 0, distance = 0, timeSeconds = 0 } = data;
  
  switch (type) {
    case 'bodyweight':
      return reps; // 1 XP per rep
    
    case 'strength':
      return reps; // 1 XP per rep (simplified, ignoring weight for preview)
    
    case 'endurance':
      const distanceXP = distance * 20;
      const timeXP = (timeSeconds / 60) * 2;
      return Math.round(distanceXP + timeXP);
    
    default:
      return 0;
  }
};