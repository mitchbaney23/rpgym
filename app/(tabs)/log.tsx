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

interface SimplifiedWorkoutForm {
  date: Date;
  selectedSkill: SkillName;
  exerciseName: string;
  
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LogScreen() {
  const { user, isAuthenticated, isLoading, crtOverlayEnabled } = useAppStore();
  
  // Form state
  const [form, setForm] = useState<SimplifiedWorkoutForm>({
    date: new Date(),
    selectedSkill: 'pushups',
    exerciseName: '',
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
  });
  
  // UI state
  const [recentExercises, setRecentExercises] = useState<RecentExercise[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const workoutData: SimpleWorkoutData = {
    exerciseName: form.exerciseName,
    reps: form.reps ? parseInt(form.reps) : undefined,
    weight: form.weight ? parseFloat(form.weight) : undefined,
    distance: form.distance ? parseFloat(form.distance) : undefined,
    timeSeconds: form.timeMinutes || form.timeSeconds 
      ? (parseInt(form.timeMinutes) || 0) * 60 + (parseInt(form.timeSeconds) || 0)
      : undefined,
  };

  const inferredType = inferExerciseType(workoutData);
  const isValid = validateWorkoutData(workoutData) && form.exerciseName.trim().length > 0;
  const estimatedXP = calculateEstimatedXP(workoutData);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleQuickAdd = (exercise: RecentExercise) => {
    setForm(prev => ({
      ...prev,
      exerciseName: exercise.name,
      selectedSkill: exercise.skillId,
    }));
    
    // Focus appropriate input based on skill type
    setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);
  };

  const handleCustomExercise = () => {
    setShowCustomDialog(true);
  };

  const handleCustomExerciseSubmit = () => {
    if (!customExerciseName.trim()) return;
    
    setForm(prev => ({
      ...prev,
      exerciseName: customExerciseName.trim(),
    }));
    
    setCustomExerciseName('');
    setShowCustomDialog(false);
    
    setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);
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

  const addSet = () => {
    setForm(prev => ({
      ...prev,
      sets: [...prev.sets, { reps: 0, weight: 0 }]
    }));
  };

  const updateSet = (index: number, field: keyof WorkoutSet, value: string) => {
    const numValue = parseFloat(value) || 0;
    setForm(prev => ({
      ...prev,
      sets: prev.sets.map((set, i) => 
        i === index ? { ...set, [field]: numValue } : set
      )
    }));
  };

  const handleSave = async () => {
    if (!user?.uid || !isValid) return;
    
    setIsSaving(true);
    Keyboard.dismiss();
    
    try {
      // Convert form to exercise block format
      const exerciseBlock = createExerciseBlock();
      
      // Detect PRs and apply them
      const prResults = await detectPRsAndApply(user.uid, [exerciseBlock]);
      
      // Allocate and apply workout XP
      const skillXP = allocateWorkoutXP([exerciseBlock]);
      await applyXPToSkills(user.uid, skillXP);
      
      // Recalculate overall level
      await calculateAndGetOverallLevel(user.uid);
      
      // Save workout session
      const workoutData = {
        title: `${form.exerciseName} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: Timestamp.fromDate(form.date),
        notes: form.notes,
        exercises: [exerciseBlock],
        totalXP: estimatedXP,
        prsDetected: prResults.length,
        levelsGained: prResults.reduce((total, pr) => total + (pr.levelAfter - pr.levelBefore), 0),
      };
      
      await saveWorkoutSession(user.uid, workoutData);
      
      // Add to recent exercises
      const skillId = inferSkillFromExercise(form.exerciseName, inferredType!);
      await addRecentExercise({
        name: form.exerciseName,
        skillId,
      });
      
      // Show success and return
      const message = prResults.length > 0 
        ? `Saved! +${estimatedXP} XP • ${prResults.length} PR${prResults.length > 1 ? 's' : ''}!`
        : `Saved! +${estimatedXP} XP`;
        
      Alert.alert('✅ Success!', message, [
        { text: 'Done', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const createExerciseBlock = () => {
    const exerciseId = Date.now().toString();
    const skillId = inferSkillFromExercise(form.exerciseName, inferredType!);
    
    const baseExercise = {
      id: exerciseId,
      type: inferredType!,
      name: form.exerciseName,
      skillId,
    };

    switch (inferredType) {
      case 'bodyweight':
        return {
          ...baseExercise,
          bodyweightSets: [{ 
            reps: parseInt(form.reps) || 0,
            rpe: form.rpe ? parseInt(form.rpe) : undefined
          }],
        };
        
      case 'strength':
        return {
          ...baseExercise,
          strengthSets: form.sets.map(set => ({
            reps: set.reps,
            weight: set.weight,
            rpe: form.rpe ? parseInt(form.rpe) : undefined
          })),
        };
        
      case 'endurance':
        const distance = parseFloat(form.distance) || 0;
        const timeSeconds = (parseInt(form.timeMinutes) || 0) * 60 + (parseInt(form.timeSeconds) || 0);
        
        return {
          ...baseExercise,
          enduranceData: {
            distanceKm: form.distanceUnit === 'km' ? distance : distance * 1.60934,
            timeSec: timeSeconds,
            timeInput: `${form.timeMinutes}:${form.timeSeconds.padStart(2, '0')}`,
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

            {/* Quick-Add Chips */}
            <QuickAddChips 
              exercises={recentExercises}
              onExerciseSelect={handleQuickAdd}
              onCustomSelect={handleCustomExercise}
              onMovedToday={handleMovedToday}
            />

            {/* Exercise Name Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Exercise</Text>
              <TextInput
                style={styles.exerciseInput}
                value={form.exerciseName}
                onChangeText={(text) => setForm(prev => ({ ...prev, exerciseName: text }))}
                placeholder="Enter exercise name..."
                placeholderTextColor={colors.textDim}
                autoCapitalize="words"
              />
            </View>

            {/* Contextual Input Component */}
            <ContextualInputs
              form={form}
              setForm={setForm}
              inferredType={inferredType}
              firstInputRef={firstInputRef}
              onAddSet={addSet}
              onUpdateSet={updateSet}
            />

            {/* Advanced Section */}
            <AdvancedSection
              form={form}
              setForm={setForm}
              showAdvanced={showAdvanced}
              onToggle={() => setShowAdvanced(!showAdvanced)}
            />
          </ScrollView>

          {/* Sticky Save Bar */}
          <View style={styles.saveBar}>
            <View style={styles.saveBarContent}>
              <View style={styles.xpPreview}>
                {isValid && (
                  <Text style={styles.xpText}>+{estimatedXP} XP</Text>
                )}
                {inferredType && (
                  <Text style={styles.typeText}>{inferredType.toUpperCase()}</Text>
                )}
              </View>
              <NeonButton
                title={isSaving ? "SAVING..." : "SAVE WORKOUT"}
                onPress={handleSave}
                disabled={!isValid || isSaving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>

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

interface QuickAddChipsProps {
  exercises: RecentExercise[];
  onExerciseSelect: (exercise: RecentExercise) => void;
  onCustomSelect: () => void;
  onMovedToday: () => void;
}

const QuickAddChips: React.FC<QuickAddChipsProps> = ({
  exercises,
  onExerciseSelect,
  onCustomSelect,
  onMovedToday,
}) => (
  <View style={styles.chipsSection}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
      {/* I Moved Today Chip */}
      <TouchableOpacity style={[styles.chip, styles.movedTodayChip]} onPress={onMovedToday}>
        <Text style={styles.movedTodayChipText}>🎯 I Moved Today</Text>
      </TouchableOpacity>
      
      {/* Exercise Chips */}
      {exercises.map((exercise) => (
        <TouchableOpacity
          key={exercise.name}
          style={styles.chip}
          onPress={() => onExerciseSelect(exercise)}
        >
          <Text style={styles.chipText}>{exercise.name}</Text>
        </TouchableOpacity>
      ))}
      
      {/* Custom Chip */}
      <TouchableOpacity style={[styles.chip, styles.customChip]} onPress={onCustomSelect}>
        <Text style={styles.customChipText}>+ Custom</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

interface ContextualInputsProps {
  form: SimplifiedWorkoutForm;
  setForm: React.Dispatch<React.SetStateAction<SimplifiedWorkoutForm>>;
  inferredType: ExerciseType | null;
  firstInputRef: React.RefObject<TextInput>;
  onAddSet: () => void;
  onUpdateSet: (index: number, field: keyof WorkoutSet, value: string) => void;
}

const ContextualInputs: React.FC<ContextualInputsProps> = ({
  form,
  setForm,
  inferredType,
  firstInputRef,
  onAddSet,
  onUpdateSet,
}) => {
  if (!form.exerciseName.trim()) {
    return (
      <View style={styles.section}>
        <Text style={styles.placeholderText}>Select an exercise above to continue...</Text>
      </View>
    );
  }

  switch (inferredType) {
    case 'bodyweight':
      return (
        <View style={styles.section}>
          <Text style={styles.label}>Reps</Text>
          <TextInput
            ref={firstInputRef}
            style={styles.numberInput}
            value={form.reps}
            onChangeText={(text) => setForm(prev => ({ ...prev, reps: text }))}
            placeholder="0"
            placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
      );

    case 'strength':
      return (
        <View style={styles.section}>
          <Text style={styles.label}>Sets</Text>
          {form.sets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text style={styles.setNumber}>{index + 1}</Text>
              <TextInput
                ref={index === 0 ? firstInputRef : undefined}
                style={styles.setInput}
                value={set.weight.toString()}
                onChangeText={(text) => onUpdateSet(index, 'weight', text)}
                placeholder="Weight"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.setX}>×</Text>
              <TextInput
                style={styles.setInput}
                value={set.reps.toString()}
                onChangeText={(text) => onUpdateSet(index, 'reps', text)}
                placeholder="Reps"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
          ))}
          <TouchableOpacity style={styles.addSetButton} onPress={onAddSet}>
            <Text style={styles.addSetText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      );

    case 'endurance':
      return (
        <View style={styles.section}>
          <View style={styles.enduranceRow}>
            <View style={styles.distanceContainer}>
              <Text style={styles.label}>Distance</Text>
              <View style={styles.distanceInputRow}>
                <TextInput
                  ref={firstInputRef}
                  style={[styles.numberInput, styles.distanceInput]}
                  value={form.distance}
                  onChangeText={(text) => setForm(prev => ({ ...prev, distance: text }))}
                  placeholder="0.0"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <TouchableOpacity
                  style={styles.unitToggle}
                  onPress={() => setForm(prev => ({ 
                    ...prev, 
                    distanceUnit: prev.distanceUnit === 'km' ? 'mi' : 'km' 
                  }))}
                >
                  <Text style={styles.unitToggleText}>{form.distanceUnit}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.timeContainer}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  value={form.timeMinutes}
                  onChangeText={(text) => setForm(prev => ({ ...prev, timeMinutes: text }))}
                  placeholder="00"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={form.timeSeconds}
                  onChangeText={(text) => setForm(prev => ({ ...prev, timeSeconds: text }))}
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

interface AdvancedSectionProps {
  form: SimplifiedWorkoutForm;
  setForm: React.Dispatch<React.SetStateAction<SimplifiedWorkoutForm>>;
  showAdvanced: boolean;
  onToggle: () => void;
}

const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  form,
  setForm,
  showAdvanced,
  onToggle,
}) => (
  <View style={styles.section}>
    <TouchableOpacity style={styles.advancedToggle} onPress={onToggle}>
      <Text style={styles.advancedToggleText}>
        {showAdvanced ? '▼' : '▶'} Advanced Options
      </Text>
    </TouchableOpacity>
    
    {showAdvanced && (
      <View style={styles.advancedFields}>
        <View style={styles.advancedField}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={form.notes}
            onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
            placeholder="How did it feel?"
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={2}
          />
        </View>
        
        <View style={styles.advancedRow}>
          <View style={[styles.advancedField, { flex: 1, marginRight: spacing.md }]}>
            <Text style={styles.label}>RPE (1-10)</Text>
            <TextInput
              style={styles.numberInput}
              value={form.rpe}
              onChangeText={(text) => setForm(prev => ({ ...prev, rpe: text }))}
              placeholder="0"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          
          <View style={[styles.advancedField, { flex: 1 }]}>
            <Text style={styles.label}>Equipment</Text>
            <TextInput
              style={styles.textInput}
              value={form.equipment}
              onChangeText={(text) => setForm(prev => ({ ...prev, equipment: text }))}
              placeholder="Barbell, etc."
              placeholderTextColor={colors.textDim}
            />
          </View>
        </View>
      </View>
    )}
  </View>
);

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
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  // Quick-add chips
  chipsSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[6],
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginRight: spacing[2],
  },
  chipText: {
    ...typography.labelMedium,
    color: colors.text,
  },
  movedTodayChip: {
    backgroundColor: colors.panel,
    borderColor: colors.accent,
  },
  movedTodayChipText: {
    ...typography.labelMedium,
    color: colors.accent,
  },
  customChip: {
    borderColor: colors.accentAlt,
    borderStyle: 'dashed',
  },
  customChipText: {
    ...typography.labelMedium,
    color: colors.accentAlt,
  },
  
  // Form sections
  section: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[6],
  },
  label: {
    ...typography.labelMedium,
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
  
  // Strength sets
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  setNumber: {
    ...typography.labelLarge,
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
    ...typography.labelMedium,
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
    ...typography.labelMedium,
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
    ...typography.labelLarge,
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
    ...typography.labelMedium,
    color: colors.text,
  },
  dialogButtonPrimaryText: {
    color: colors.bg,
  },
});