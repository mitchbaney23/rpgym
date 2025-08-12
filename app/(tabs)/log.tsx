import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { useAppStore } from '../../lib/store';
import { colors, spacing, radii, layout } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { NeonButton } from '../../components/NeonButton';
import { RetroBackground } from '../../components/RetroBackground';
import { SkillName, ExerciseType } from '../../types/domain';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { saveWorkoutSession, calculateAndGetOverallLevel } from '../../lib/firestore';
import { 
  detectPRsAndApply, 
  allocateWorkoutXP, 
  applyXPToSkills,
  getSkillForExercise
} from '../../utils/pr';
import {
  inferExerciseType,
  validateWorkoutData,
  inferSkillFromExercise,
  calculateEstimatedXP,
  SimpleWorkoutData
} from '../../utils/inferExerciseType';
import {
  getRecentExercises,
  addRecentExercise,
  getLastUsedSkill,
  RecentExercise
} from '../../utils/recentExercises';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface WorkoutSet {
  reps: number;
  weight: number;
}

interface WorkoutExercise {
  id: string;
  exerciseName: string;
  selectedSkill: SkillName;
  inferredType: ExerciseType | null;
  
  // Contextual inputs
  reps: string;
  sets: WorkoutSet[];
  weight: string;
  distance: string;
  timeMinutes: string;
  timeSeconds: string;
  distanceUnit: 'km' | 'mi';
  
  // Advanced fields
  notes: string;
  rpe: string;
  equipment: string;
  tags: string;
}

interface SimplifiedWorkoutForm {
  date: Date;
  exercises: WorkoutExercise[];
  workoutNotes: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LogScreen() {
  const { user, isAuthenticated, isLoading, crtOverlayEnabled } = useAppStore();
  
  // Form state
  const [form, setForm] = useState<SimplifiedWorkoutForm>({
    date: new Date(),
    exercises: [],
    workoutNotes: '',
  });
  
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  
  // UI state
  const [recentExercises, setRecentExercises] = useState<RecentExercise[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  
  // Refs for focus management
  const firstInputRef = useRef<TextInput>(null);

  // =============================================================================
  // EFFECTS AND INITIALIZATION
  // =============================================================================

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (user) {
      initializeForm();
    }
  }, [user]);

  const initializeForm = async () => {
    try {
      const [exercises, lastSkill] = await Promise.all([
        getRecentExercises(),
        getLastUsedSkill()
      ]);
      
      setRecentExercises(exercises);
      setForm(prev => ({
        ...prev,
        selectedSkill: lastSkill
      }));
    } catch (error) {
      console.error('Error initializing form:', error);
    }
  };

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const totalEstimatedXP = form.exercises.reduce((total, exercise) => {
    const workoutData: SimpleWorkoutData = {
      exerciseName: exercise.exerciseName,
      reps: exercise.reps ? parseInt(exercise.reps) : undefined,
      weight: exercise.weight ? parseFloat(exercise.weight) : undefined,
      distance: exercise.distance ? parseFloat(exercise.distance) : undefined,
      timeSeconds: exercise.timeMinutes || exercise.timeSeconds 
        ? (parseInt(exercise.timeMinutes) || 0) * 60 + (parseInt(exercise.timeSeconds) || 0)
        : undefined,
    };
    return total + calculateEstimatedXP(workoutData);
  }, 0);
  
  const isValid = form.exercises.length > 0 && form.exercises.every(exercise => 
    exercise.exerciseName.trim().length > 0
  );

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleExerciseSelect = (exercise: RecentExercise) => {
    // Infer type from skill mapping
    let inferredType: ExerciseType;
    if (['pushups', 'pullups', 'squats', 'situps'].includes(exercise.skillId)) {
      inferredType = 'bodyweight';
    } else if (['deadlift', 'squat', 'bench', 'overhead'].includes(exercise.skillId)) {
      inferredType = 'strength';
    } else {
      inferredType = 'endurance';
    }
    
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseName: exercise.name,
      selectedSkill: exercise.skillId,
      inferredType,
      reps: '',
      sets: [{ reps: 0, weight: 0 }],
      weight: '',
      distance: '',
      timeMinutes: '',
      timeSeconds: '',
      distanceUnit: 'mi',
      notes: '',
      rpe: '',
      equipment: '',
      tags: '',
    };
    
    setForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    setShowDropdown(false);
    setEditingExerciseId(newExercise.id);
  };

  const handleCustomExercise = () => {
    setShowCustomDialog(true);
  };

  const handleCustomExerciseSubmit = () => {
    if (!customExerciseName.trim()) return;
    
    const skillId = inferSkillFromExercise(customExerciseName.trim(), 'bodyweight');
    
    // Infer type from skill mapping or exercise name
    let inferredType: ExerciseType = 'bodyweight'; // default
    if (['deadlift', 'squat', 'bench', 'overhead'].includes(skillId)) {
      inferredType = 'strength';
    } else if (['5k', '10k', 'marathon', 'mile'].includes(skillId)) {
      inferredType = 'endurance';
    } else if (customExerciseName.toLowerCase().includes('run') || 
               customExerciseName.toLowerCase().includes('bike') ||
               customExerciseName.toLowerCase().includes('swim')) {
      inferredType = 'endurance';
    } else if (customExerciseName.toLowerCase().includes('press') ||
               customExerciseName.toLowerCase().includes('curl') ||
               customExerciseName.toLowerCase().includes('row')) {
      inferredType = 'strength';
    }
    
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseName: customExerciseName.trim(),
      selectedSkill: skillId,
      inferredType,
      reps: '',
      sets: [{ reps: 0, weight: 0 }],
      weight: '',
      distance: '',
      timeMinutes: '',
      timeSeconds: '',
      distanceUnit: 'mi',
      notes: '',
      rpe: '',
      equipment: '',
      tags: '',
    };
    
    setForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    
    setCustomExerciseName('');
    setShowCustomDialog(false);
    setShowDropdown(false);
    setEditingExerciseId(newExercise.id);
  };

  const handleMovedToday = async () => {
    if (!user?.uid) return;
    
    try {
      // Use the existing logDailyQuest function
      const { logDailyQuest } = await import('../../lib/firestore');
      await logDailyQuest(user.uid);
      
      Alert.alert('🎯 Logged!', 'Way to move today! Streak updated.', [
        { text: 'Great!', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error logging daily quest:', error);
      Alert.alert('Error', 'Could not log activity. Please try again.');
    }
  };

  const addSetToExercise = (exerciseId: string) => {
    const exercise = form.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      handleUpdateExercise(exerciseId, {
        sets: [...exercise.sets, { reps: 0, weight: 0 }]
      });
    }
  };

  const updateExerciseSet = (exerciseId: string, index: number, field: keyof WorkoutSet, value: string) => {
    const exercise = form.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      const numValue = parseFloat(value) || 0;
      const updatedSets = exercise.sets.map((set, i) => 
        i === index ? { ...set, [field]: numValue } : set
      );
      handleUpdateExercise(exerciseId, { sets: updatedSets });
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !isValid) return;
    
    setIsSaving(true);
    Keyboard.dismiss();
    
    try {
      // Convert form exercises to exercise blocks
      const exerciseBlocks = form.exercises.map(exercise => createExerciseBlock(exercise));
      
      // Detect PRs and apply them
      const prResults = await detectPRsAndApply(user.uid, exerciseBlocks);
      
      // Allocate and apply workout XP
      const skillXP = allocateWorkoutXP(exerciseBlocks);
      await applyXPToSkills(user.uid, skillXP);
      
      // Recalculate overall level
      await calculateAndGetOverallLevel(user.uid);
      
      // Save workout session
      const workoutTitle = form.exercises.length === 1 
        ? `${form.exercises[0].exerciseName} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : `${form.exercises.length} Exercises - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
      const workoutData = {
        title: workoutTitle,
        date: Timestamp.fromDate(form.date),
        notes: form.workoutNotes,
        exercises: exerciseBlocks,
        totalXP: totalEstimatedXP,
        prsDetected: prResults.length,
        levelsGained: prResults.reduce((total, pr) => total + (pr.levelAfter - pr.levelBefore), 0),
      };
      
      await saveWorkoutSession(user.uid, workoutData);
      
      // Add all exercises to recent exercises
      for (const exercise of form.exercises) {
        await addRecentExercise({
          name: exercise.exerciseName,
          skillId: exercise.selectedSkill,
        });
      }
      
      // Show success with option to log another workout
      const message = prResults.length > 0 
        ? `Saved! +${totalEstimatedXP} XP • ${prResults.length} PR${prResults.length > 1 ? 's' : ''}!`
        : `Saved! +${totalEstimatedXP} XP`;
        
      Alert.alert('✅ Success!', message, [
        { text: 'Log Another', onPress: handleLogAnother },
        { text: 'Done', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLogAnother = () => {
    // Reset form to default state but keep date
    setForm({
      date: new Date(),
      exercises: [],
      workoutNotes: '',
    });
    setEditingExerciseId(null);
    setIsSaving(false);
  };
  
  const handleRemoveExercise = (exerciseId: string) => {
    setForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
    if (editingExerciseId === exerciseId) {
      setEditingExerciseId(null);
    }
  };
  
  const handleUpdateExercise = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setForm(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      )
    }));
    
    // Update inferred type if exercise name changed
    if (updates.exerciseName) {
      const exercise = form.exercises.find(ex => ex.id === exerciseId);
      if (exercise) {
        const workoutData: SimpleWorkoutData = { exerciseName: updates.exerciseName };
        const inferredType = inferExerciseType(workoutData);
        setForm(prev => ({
          ...prev,
          exercises: prev.exercises.map(ex => 
            ex.id === exerciseId ? { ...ex, inferredType } : ex
          )
        }));
      }
    }
  };

  const createExerciseBlock = (exercise: WorkoutExercise) => {
    const baseExercise = {
      id: exercise.id,
      type: exercise.inferredType!,
      name: exercise.exerciseName,
      skillId: exercise.selectedSkill,
    };

    switch (exercise.inferredType) {
      case 'bodyweight':
        return {
          ...baseExercise,
          bodyweightSets: [{ 
            reps: parseInt(exercise.reps) || 0,
            rpe: exercise.rpe ? parseInt(exercise.rpe) : undefined
          }],
        };
        
      case 'strength':
        return {
          ...baseExercise,
          strengthSets: exercise.sets.map(set => ({
            reps: set.reps,
            weight: set.weight,
            rpe: exercise.rpe ? parseInt(exercise.rpe) : undefined
          })),
        };
        
      case 'endurance':
        const distance = parseFloat(exercise.distance) || 0;
        const timeSeconds = (parseInt(exercise.timeMinutes) || 0) * 60 + (parseInt(exercise.timeSeconds) || 0);
        
        return {
          ...baseExercise,
          enduranceData: {
            distanceKm: exercise.distanceUnit === 'km' ? distance : distance * 1.60934,
            timeSec: timeSeconds,
            timeInput: `${exercise.timeMinutes}:${exercise.timeSeconds.padStart(2, '0')}`,
          },
        };
        
      default:
        return baseExercise;
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (!isAuthenticated || isLoading) {
    return (
      <RetroBackground showScanlines={crtOverlayEnabled}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>LOADING...</Text>
        </SafeAreaView>
      </RetroBackground>
    );
  }

  return (
    <RetroBackground showScanlines={crtOverlayEnabled}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>⚡ LOG WORKOUT</Text>
              <View style={styles.datePill}>
                <Text style={styles.dateText}>
                  {form.date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>

            {/* Exercise Selection Dropdown */}
            <View style={styles.section}>
              <Text style={styles.label}>Select Exercise</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(true)}
              >
                <Text style={[styles.dropdownButtonText, styles.dropdownPlaceholder]}>
                  Choose an exercise...
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            
            {/* Moved Today Button */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.movedTodayButton} onPress={handleMovedToday}>
                <Text style={styles.movedTodayButtonText}>🎯 I Moved Today (Quick Log)</Text>
              </TouchableOpacity>
            </View>

            {/* Exercise List */}
            <ExerciseList
              exercises={form.exercises}
              editingExerciseId={editingExerciseId}
              onEditExercise={setEditingExerciseId}
              onUpdateExercise={handleUpdateExercise}
              onRemoveExercise={handleRemoveExercise}
            />
            
            {/* Workout Notes */}
            {form.exercises.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>Workout Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={form.workoutNotes}
                  onChangeText={(text) => setForm(prev => ({ ...prev, workoutNotes: text }))}
                  placeholder="How was the overall workout?"
                  placeholderTextColor={colors.textDim}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

}
          </ScrollView>

          {/* Always Visible Save Bar */}
          <View style={styles.saveBar}>
            <View style={styles.saveBarContent}>
              <View style={styles.xpPreview}>
                {isValid && (
                  <Text style={styles.xpText}>+{totalEstimatedXP} XP</Text>
                )}
                {form.exercises.length > 0 && (
                  <Text style={styles.typeText}>{form.exercises.length} EXERCISE{form.exercises.length > 1 ? 'S' : ''}</Text>
                )}
              </View>
              <NeonButton
                title={isSaving ? "SAVING..." : "SUBMIT WORKOUT"}
                onPress={handleSave}
                disabled={!isValid || isSaving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Exercise Dropdown Modal */}
        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownModal}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              
              {/* Recent Exercises */}
              <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
                {recentExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.name}
                    style={styles.exerciseItem}
                    onPress={() => handleExerciseSelect(exercise)}
                  >
                    <Text style={styles.exerciseItemText}>{exercise.name}</Text>
                    <Text style={styles.exerciseItemSkill}>{exercise.skillId}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.customButton]} 
                  onPress={handleCustomExercise}
                >
                  <Text style={styles.customButtonText}>+ Custom Exercise</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => setShowDropdown(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Exercise Dialog */}
        {showCustomDialog && (
          <CustomExerciseDialog
            value={customExerciseName}
            onChangeText={setCustomExerciseName}
            onSubmit={handleCustomExerciseSubmit}
            onCancel={() => {
              setShowCustomDialog(false);
              setCustomExerciseName('');
            }}
          />
        )}
      </SafeAreaView>
    </RetroBackground>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ExerciseListProps {
  exercises: WorkoutExercise[];
  editingExerciseId: string | null;
  onEditExercise: (id: string | null) => void;
  onUpdateExercise: (id: string, updates: Partial<WorkoutExercise>) => void;
  onRemoveExercise: (id: string) => void;
}

const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  editingExerciseId,
  onEditExercise,
  onUpdateExercise,
  onRemoveExercise,
}) => {
  if (exercises.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.placeholderText}>Select exercises above to start building your workout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Today's Workout ({exercises.length} exercise{exercises.length > 1 ? 's' : ''})</Text>
      {exercises.map((exercise, index) => (
        <ExerciseItem
          key={exercise.id}
          exercise={exercise}
          index={index}
          isEditing={editingExerciseId === exercise.id}
          onEdit={() => onEditExercise(exercise.id)}
          onUpdate={(updates) => onUpdateExercise(exercise.id, updates)}
          onRemove={() => onRemoveExercise(exercise.id)}
          onAddSet={() => {
            const newSets = [...exercise.sets, { reps: 0, weight: 0 }];
            onUpdateExercise(exercise.id, { sets: newSets });
          }}
          onUpdateSet={(setIndex, field, value) => {
            const numValue = parseFloat(value) || 0;
            const updatedSets = exercise.sets.map((set, i) => 
              i === setIndex ? { ...set, [field]: numValue } : set
            );
            onUpdateExercise(exercise.id, { sets: updatedSets });
          }}
        />
      ))}
    </View>
  );
};

interface ExerciseItemProps {
  exercise: WorkoutExercise;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<WorkoutExercise>) => void;
  onRemove: () => void;
  onAddSet: () => void;
  onUpdateSet: (index: number, field: keyof WorkoutSet, value: string) => void;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  index,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  onAddSet,
  onUpdateSet,
}) => {
  const workoutData: SimpleWorkoutData = {
    exerciseName: exercise.exerciseName,
    reps: exercise.reps ? parseInt(exercise.reps) : undefined,
    weight: exercise.weight ? parseFloat(exercise.weight) : undefined,
    distance: exercise.distance ? parseFloat(exercise.distance) : undefined,
    timeSeconds: exercise.timeMinutes || exercise.timeSeconds 
      ? (parseInt(exercise.timeMinutes) || 0) * 60 + (parseInt(exercise.timeSeconds) || 0)
      : undefined,
  };
  
  const estimatedXP = calculateEstimatedXP(workoutData);
  const isValidExercise = validateWorkoutData(workoutData);

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseHeaderLeft}>
          <Text style={styles.exerciseTitle}>{index + 1}. {exercise.exerciseName}</Text>
          {exercise.inferredType && (
            <Text style={styles.exerciseType}>{exercise.inferredType.toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.exerciseHeaderRight}>
          <Text style={styles.exerciseXP}>+{estimatedXP} XP</Text>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={onEdit}
          >
            <Text style={styles.editButtonText}>{isEditing ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={onRemove}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {isEditing && (
        <ExerciseInputs
          exercise={exercise}
          onUpdate={onUpdate}
          onAddSet={onAddSet}
          onUpdateSet={onUpdateSet}
        />
      )}
      
      {!isValidExercise && (
        <Text style={styles.exerciseError}>⚠ Complete the exercise data above</Text>
      )}
    </View>
  );
};

interface ExerciseInputsProps {
  exercise: WorkoutExercise;
  onUpdate: (updates: Partial<WorkoutExercise>) => void;
  onAddSet: () => void;
  onUpdateSet: (index: number, field: keyof WorkoutSet, value: string) => void;
}

const ExerciseInputs: React.FC<ExerciseInputsProps> = ({
  exercise,
  onUpdate,
  onAddSet,
  onUpdateSet,
}) => {
  switch (exercise.inferredType) {
    case 'bodyweight':
      return (
        <View style={styles.exerciseInputs}>
          <View style={styles.exerciseField}>
            <Text style={styles.exerciseFieldLabel}>Reps</Text>
            <TextInput
              style={styles.numberInput}
              value={exercise.reps}
              onChangeText={(text) => onUpdate({ reps: text })}
              placeholder="0"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
        </View>
      );

    case 'strength':
      return (
        <View style={styles.exerciseInputs}>
          <Text style={styles.exerciseFieldLabel}>Sets</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.setsScrollView}
            contentContainerStyle={styles.setsScrollContent}
          >
            {exercise.sets.map((set, index) => (
              <View key={index} style={styles.setCard}>
                <Text style={styles.setCardNumber}>{index + 1}</Text>
                <TextInput
                  style={styles.setCardInput}
                  value={set.weight > 0 ? set.weight.toString() : ''}
                  onChangeText={(text) => onUpdateSet(index, 'weight', text)}
                  placeholder="lbs"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={styles.setCardX}>×</Text>
                <TextInput
                  style={styles.setCardInput}
                  value={set.reps > 0 ? set.reps.toString() : ''}
                  onChangeText={(text) => onUpdateSet(index, 'reps', text)}
                  placeholder="reps"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
              </View>
            ))}
            
            <TouchableOpacity style={styles.addSetCard} onPress={onAddSet}>
              <Text style={styles.addSetCardText}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );

    case 'endurance':
      return (
        <View style={styles.exerciseInputs}>
          <View style={styles.enduranceRow}>
            <View style={styles.distanceContainer}>
              <Text style={styles.exerciseFieldLabel}>Distance</Text>
              <View style={styles.distanceInputRow}>
                <TextInput
                  style={[styles.numberInput, styles.distanceInput]}
                  value={exercise.distance}
                  onChangeText={(text) => onUpdate({ distance: text })}
                  placeholder="0.0"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.unitToggle}
                  onPress={() => onUpdate({ 
                    distanceUnit: exercise.distanceUnit === 'km' ? 'mi' : 'km' 
                  })}
                >
                  <Text style={styles.unitToggleText}>{exercise.distanceUnit}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.timeContainer}>
              <Text style={styles.exerciseFieldLabel}>Time</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  value={exercise.timeMinutes}
                  onChangeText={(text) => onUpdate({ timeMinutes: text })}
                  placeholder="00"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={exercise.timeSeconds}
                  onChangeText={(text) => onUpdate({ timeSeconds: text })}
                  placeholder="00"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>
            </View>
          </View>
        </View>
      );

    default:
      return null;
  }
};




interface CustomExerciseDialogProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const CustomExerciseDialog: React.FC<CustomExerciseDialogProps> = ({
  value,
  onChangeText,
  onSubmit,
  onCancel,
}) => (
  <View style={styles.dialogOverlay}>
    <View style={styles.dialog}>
      <Text style={styles.dialogTitle}>Custom Exercise</Text>
      <TextInput
        style={styles.dialogInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="Exercise name..."
        placeholderTextColor={colors.textDim}
        autoFocus
        autoCapitalize="words"
      />
      <View style={styles.dialogButtons}>
        <TouchableOpacity style={styles.dialogButton} onPress={onCancel}>
          <Text style={styles.dialogButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.dialogButton, styles.dialogButtonPrimary]} 
          onPress={onSubmit}
          disabled={!value.trim()}
        >
          <Text style={[styles.dialogButtonText, styles.dialogButtonPrimaryText]}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textDim,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing[2],
  },
  datePill: {
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  // Dropdown styles
  dropdownButton: {
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: colors.textDim,
  },
  dropdownArrow: {
    ...typography.body,
    color: colors.textSecondary,
  },
  movedTodayButton: {
    backgroundColor: colors.panel,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  movedTodayButtonText: {
    ...typography.label,
    color: colors.accent,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  dropdownModal: {
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[4],
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  exerciseList: {
    maxHeight: 300,
    marginBottom: spacing[4],
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomColor: colors.stroke,
    borderBottomWidth: 1,
  },
  exerciseItemText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  exerciseItemSkill: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.panel,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
    backgroundColor: colors.panel,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  customButton: {
    borderColor: colors.accentAlt,
  },
  modalButtonText: {
    ...typography.label,
    color: colors.text,
  },
  customButtonText: {
    ...typography.label,
    color: colors.accentAlt,
  },
  
  // Form sections
  section: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[6],
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing[2],
  },
  exerciseInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
  },
  numberInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
    textAlign: 'center',
  },
  textInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textDim,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing[6],
  },
  
  // Strength sets (horizontal)
  setsScrollView: {
    marginTop: spacing[2],
  },
  setsScrollContent: {
    paddingRight: spacing[4],
  },
  setCard: {
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    marginRight: spacing[3],
    alignItems: 'center',
    minWidth: 100,
  },
  setCardNumber: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing[2],
    fontWeight: 'bold',
  },
  setCardInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.bg,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    marginBottom: spacing[1],
  },
  setCardX: {
    ...typography.body,
    color: colors.textDim,
    marginVertical: spacing[1],
    fontSize: 12,
  },
  addSetCard: {
    backgroundColor: colors.panel,
    borderColor: colors.accentAlt,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 100,
  },
  addSetCardText: {
    ...typography.h3,
    color: colors.accentAlt,
  },
  
  // Legacy set styles (kept for compatibility)
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  setNumber: {
    ...typography.label,
    color: colors.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  setInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: spacing[2],
  },
  setX: {
    ...typography.body,
    color: colors.textDim,
    marginHorizontal: spacing[1],
  },
  addSetButton: {
    backgroundColor: colors.panel,
    borderColor: colors.accentAlt,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  addSetText: {
    ...typography.label,
    color: colors.accentAlt,
  },
  
  // Endurance inputs
  enduranceRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  distanceContainer: {
    flex: 1,
  },
  distanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceInput: {
    flex: 1,
    marginRight: spacing[2],
  },
  unitToggle: {
    backgroundColor: colors.panel,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    minWidth: 40,
    alignItems: 'center',
  },
  unitToggleText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: 'bold',
  },
  timeContainer: {
    flex: 1,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    fontSize: 16,
    textAlign: 'center',
    width: 50,
  },
  timeColon: {
    ...typography.h3,
    color: colors.text,
    marginHorizontal: spacing[1],
  },
  
  // Advanced section
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  advancedToggleText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  advancedFields: {
    marginTop: spacing[4],
  },
  advancedField: {
    marginBottom: spacing[4],
  },
  advancedRow: {
    flexDirection: 'row',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  
  // Save bar
  saveBar: {
    backgroundColor: colors.bg,
    borderTopColor: colors.stroke,
    borderTopWidth: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[3],
    paddingBottom: spacing[4],
  },
  saveBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpPreview: {
    alignItems: 'flex-start',
  },
  xpText: {
    ...typography.label,
    color: colors.accent,
    fontWeight: 'bold',
  },
  typeText: {
    ...typography.caption,
    color: colors.textDim,
  },
  saveButton: {
    flex: 1,
    marginLeft: spacing[4],
  },
  mainSubmitButton: {
    marginBottom: spacing[3],
  },
  submitPreview: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  submitXpText: {
    ...typography.label,
    color: colors.accent,
    fontWeight: 'bold',
  },
  submitTypeText: {
    ...typography.caption,
    color: colors.textDim,
  },
  
  // Exercise cards
  exerciseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.panel,
  },
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing[1],
  },
  exerciseType: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  exerciseXP: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: 'bold',
  },
  editButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  removeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    ...typography.body,
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseError: {
    ...typography.caption,
    color: colors.error,
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[2],
    fontStyle: 'italic',
  },
  exerciseInputs: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
  },
  exerciseField: {
    marginBottom: spacing[3],
  },
  exerciseFieldLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing[2],
  },
  
  // Custom exercise dialog
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  dialog: {
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[6],
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  dialogInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.bg,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
    marginBottom: spacing[6],
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dialogButton: {
    flex: 1,
    backgroundColor: colors.panel,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  dialogButtonPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dialogButtonText: {
    ...typography.label,
    color: colors.text,
  },
  dialogButtonPrimaryText: {
    color: colors.bg,
  },
});