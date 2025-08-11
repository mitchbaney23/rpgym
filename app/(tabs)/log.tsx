import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../../lib/store';
import { colors, spacing, radii, layout } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { NeonButton } from '../../components/NeonButton';
import { RetroBackground } from '../../components/RetroBackground';
import {
  WorkoutSession,
  ExerciseBlock,
  ExerciseType,
  WorkoutForm,
  StrengthSet,
  BodyweightSet,
  EnduranceData,
  XPBreakdown,
  PRResult,
} from '../../types/domain';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { saveWorkoutSession } from '../../lib/firestore';
import { detectPRsAndApply, calculateWorkoutXP } from '../../utils/pr';

export default function LogScreen() {
  const { user, isAuthenticated, isLoading } = useAppStore();
  const [workoutForm, setWorkoutForm] = useState<WorkoutForm>({
    title: '',
    date: new Date(),
    notes: '',
    durationMin: '',
  });
  const [exercises, setExercises] = useState<ExerciseBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    // Set default workout title with current date
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    setWorkoutForm(prev => ({
      ...prev,
      title: `Workout - ${dateString}`,
    }));
  }, []);

  const addExercise = (type: ExerciseType) => {
    const newExercise: ExerciseBlock = {
      id: Date.now().toString(),
      type,
      name: '',
    };

    // Initialize type-specific data
    switch (type) {
      case 'strength':
        newExercise.strengthSets = [{ reps: 0, weight: 0 }];
        break;
      case 'bodyweight':
        newExercise.bodyweightSets = [{ reps: 0 }];
        break;
      case 'endurance':
        newExercise.enduranceData = { timeSec: 0 };
        break;
    }

    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const updateExercise = (exerciseId: string, updates: Partial<ExerciseBlock>) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ));
  };

  const addSet = (exerciseId: string, type: 'strength' | 'bodyweight') => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const updates: Partial<ExerciseBlock> = {};
    
    if (type === 'strength' && exercise.strengthSets) {
      const lastSet = exercise.strengthSets[exercise.strengthSets.length - 1];
      updates.strengthSets = [...exercise.strengthSets, { ...lastSet }];
    } else if (type === 'bodyweight' && exercise.bodyweightSets) {
      const lastSet = exercise.bodyweightSets[exercise.bodyweightSets.length - 1];
      updates.bodyweightSets = [...exercise.bodyweightSets, { ...lastSet }];
    }

    updateExercise(exerciseId, updates);
  };

  const updateSet = (
    exerciseId: string, 
    setIndex: number, 
    type: 'strength' | 'bodyweight', 
    field: string, 
    value: number
  ) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const updates: Partial<ExerciseBlock> = {};
    
    if (type === 'strength' && exercise.strengthSets) {
      const newSets = [...exercise.strengthSets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      updates.strengthSets = newSets;
    } else if (type === 'bodyweight' && exercise.bodyweightSets) {
      const newSets = [...exercise.bodyweightSets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      updates.bodyweightSets = newSets;
    }

    updateExercise(exerciseId, updates);
  };

  const parseTimeInput = (timeStr: string): number => {
    // Handle mm:ss format
    if (timeStr.includes(':')) {
      const [minutes, seconds] = timeStr.split(':').map(Number);
      return (minutes || 0) * 60 + (seconds || 0);
    }
    // Handle seconds only
    return parseInt(timeStr) || 0;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateEnduranceTime = (exerciseId: string, timeStr: string) => {
    const timeSec = parseTimeInput(timeStr);
    updateExercise(exerciseId, {
      enduranceData: {
        ...exercises.find(ex => ex.id === exerciseId)?.enduranceData,
        timeSec,
      }
    });
  };

  const saveWorkout = async () => {
    if (!user || exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    if (!workoutForm.title.trim()) {
      Alert.alert('Error', 'Please enter a workout title');
      return;
    }

    setIsSaving(true);
    try {
      const namedExercises = exercises.filter(ex => ex.name.trim());
      
      // Detect and apply PRs
      const prResults = await detectPRsAndApply(user.uid, namedExercises);
      
      // Calculate XP
      const xpBreakdown = calculateWorkoutXP(namedExercises, prResults);
      
      const workout: Omit<WorkoutSession, 'id'> = {
        title: workoutForm.title,
        date: Timestamp.fromDate(workoutForm.date),
        notes: workoutForm.notes,
        durationMin: workoutForm.durationMin ? parseInt(workoutForm.durationMin) : undefined,
        exercises: namedExercises,
        totalXP: xpBreakdown.totalXP,
        prsDetected: prResults.length,
        levelsGained: prResults.reduce((total, pr) => total + (pr.levelAfter - pr.levelBefore), 0),
      };

      // Save workout to Firebase
      await saveWorkoutSession(user.uid, workout);
      
      // Show success message with stats
      const message = `Workout saved!\n\nXP Earned: ${xpBreakdown.totalXP}\nPRs: ${prResults.length}\nLevels Gained: ${workout.levelsGained || 0}`;
      
      Alert.alert(
        '🎉 Success!',
        message,
        [
          {
            text: 'Awesome!',
            onPress: () => {
              // Reset form
              setExercises([]);
              const today = new Date();
              const dateString = today.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              setWorkoutForm({
                title: `Workout - ${dateString}`,
                date: new Date(),
                notes: '',
                durationMin: '',
              });
              
              // Reload user data to reflect new levels
              // TODO: Add this to store if needed
              // loadUserData();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <RetroBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>LOADING...</Text>
        </SafeAreaView>
      </RetroBackground>
    );
  }

  return (
    <RetroBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>⚡ LOG WORKOUT</Text>
          </View>

          {/* Workout Details Form */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={workoutForm.title}
                onChangeText={(text) => setWorkoutForm(prev => ({ ...prev, title: text }))}
                placeholder="Workout Title"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
                <Text style={styles.label}>Duration (min)</Text>
                <TextInput
                  style={styles.textInput}
                  value={workoutForm.durationMin}
                  onChangeText={(text) => setWorkoutForm(prev => ({ ...prev, durationMin: text }))}
                  placeholder="45"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={workoutForm.notes}
                onChangeText={(text) => setWorkoutForm(prev => ({ ...prev, notes: text }))}
                placeholder="How did it feel? Any observations..."
                placeholderTextColor={colors.textDim}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Exercise Blocks */}
          <View style={styles.exerciseSection}>
            <Text style={styles.sectionTitle}>EXERCISES</Text>
            
            {exercises.map((exercise, index) => (
              <ExerciseBlockComponent
                key={exercise.id}
                exercise={exercise}
                onUpdate={(updates) => updateExercise(exercise.id, updates)}
                onRemove={() => removeExercise(exercise.id)}
                onAddSet={(type) => addSet(exercise.id, type)}
                onUpdateSet={(setIndex, type, field, value) => 
                  updateSet(exercise.id, setIndex, type, field, value)
                }
                onUpdateEnduranceTime={(timeStr) => updateEnduranceTime(exercise.id, timeStr)}
              />
            ))}

            {/* Add Exercise Buttons */}
            <View style={styles.addExerciseContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addExercise('strength')}
              >
                <Text style={styles.addButtonText}>+ Strength</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addExercise('bodyweight')}
              >
                <Text style={styles.addButtonText}>+ Bodyweight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addExercise('endurance')}
              >
                <Text style={styles.addButtonText}>+ Endurance</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <NeonButton
              title={isSaving ? 'SAVING...' : 'SAVE WORKOUT'}
              onPress={saveWorkout}
              disabled={isSaving || exercises.length === 0}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </RetroBackground>
  );
}

// Exercise Block Component
interface ExerciseBlockProps {
  exercise: ExerciseBlock;
  onUpdate: (updates: Partial<ExerciseBlock>) => void;
  onRemove: () => void;
  onAddSet: (type: 'strength' | 'bodyweight') => void;
  onUpdateSet: (setIndex: number, type: 'strength' | 'bodyweight', field: string, value: number) => void;
  onUpdateEnduranceTime: (timeStr: string) => void;
}

const ExerciseBlockComponent: React.FC<ExerciseBlockProps> = ({
  exercise,
  onUpdate,
  onRemove,
  onAddSet,
  onUpdateSet,
  onUpdateEnduranceTime,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseTypeTag}>
          <Text style={styles.exerciseTypeText}>{exercise.type.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={onRemove}>
          <Text style={styles.removeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.exerciseNameInput}
        value={exercise.name}
        onChangeText={(text) => onUpdate({ name: text })}
        placeholder={`${exercise.type === 'strength' ? 'Bench Press' : 
                      exercise.type === 'bodyweight' ? 'Push-ups' : 
                      'Running'}`}
        placeholderTextColor={colors.textDim}
      />

      {/* Strength Sets */}
      {exercise.type === 'strength' && exercise.strengthSets && (
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setLabel}>Set</Text>
            <Text style={styles.setLabel}>Reps</Text>
            <Text style={styles.setLabel}>Weight</Text>
            <Text style={styles.setLabel}>RPE</Text>
          </View>
          {exercise.strengthSets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text style={styles.setNumber}>{index + 1}</Text>
              <TextInput
                style={styles.setInput}
                value={set.reps.toString()}
                onChangeText={(text) => onUpdateSet(index, 'strength', 'reps', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textDim}
              />
              <TextInput
                style={styles.setInput}
                value={set.weight.toString()}
                onChangeText={(text) => onUpdateSet(index, 'strength', 'weight', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textDim}
              />
              <TextInput
                style={styles.setInput}
                value={set.rpe?.toString() || ''}
                onChangeText={(text) => onUpdateSet(index, 'strength', 'rpe', parseInt(text) || undefined)}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.textDim}
              />
            </View>
          ))}
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => onAddSet('strength')}
          >
            <Text style={styles.addSetButtonText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bodyweight Sets */}
      {exercise.type === 'bodyweight' && exercise.bodyweightSets && (
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setLabel}>Set</Text>
            <Text style={styles.setLabel}>Reps</Text>
            <Text style={styles.setLabel}>RPE</Text>
          </View>
          {exercise.bodyweightSets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text style={styles.setNumber}>{index + 1}</Text>
              <TextInput
                style={styles.setInput}
                value={set.reps.toString()}
                onChangeText={(text) => onUpdateSet(index, 'bodyweight', 'reps', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textDim}
              />
              <TextInput
                style={styles.setInput}
                value={set.rpe?.toString() || ''}
                onChangeText={(text) => onUpdateSet(index, 'bodyweight', 'rpe', parseInt(text) || undefined)}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.textDim}
              />
            </View>
          ))}
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => onAddSet('bodyweight')}
          >
            <Text style={styles.addSetButtonText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Endurance Data */}
      {exercise.type === 'endurance' && exercise.enduranceData && (
        <View style={styles.enduranceContainer}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
              <Text style={styles.label}>Distance (km)</Text>
              <TextInput
                style={styles.textInput}
                value={exercise.enduranceData.distanceKm?.toString() || ''}
                onChangeText={(text) => onUpdate({
                  enduranceData: {
                    ...exercise.enduranceData!,
                    distanceKm: parseFloat(text) || undefined
                  }
                })}
                keyboardType="numeric"
                placeholder="5.0"
                placeholderTextColor={colors.textDim}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Time (mm:ss)</Text>
              <TextInput
                style={styles.textInput}
                value={formatTime(exercise.enduranceData.timeSec)}
                onChangeText={onUpdateEnduranceTime}
                placeholder="25:30"
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  formSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[6],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.labelMedium,
    color: colors.text,
    marginBottom: spacing[2],
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
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  exerciseSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[8],
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing[4],
  },
  exerciseBlock: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderColor: colors.stroke,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  exerciseTypeTag: {
    backgroundColor: colors.accentAlt,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  exerciseTypeText: {
    ...typography.caption,
    color: colors.bg,
    fontWeight: 'bold',
  },
  removeButton: {
    ...typography.h4,
    color: colors.error,
  },
  exerciseNameInput: {
    ...typography.labelLarge,
    color: colors.text,
    backgroundColor: colors.bg,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },
  setsContainer: {
    marginTop: spacing[2],
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  setLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  setNumber: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  setInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.bg,
    borderColor: colors.stroke,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing[1],
    minHeight: 32,
  },
  addSetButton: {
    backgroundColor: colors.panel,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing[2],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  addSetButtonText: {
    ...typography.labelMedium,
    color: colors.accent,
  },
  enduranceContainer: {
    marginTop: spacing[2],
  },
  addExerciseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing[4],
  },
  addButton: {
    backgroundColor: colors.panel,
    borderColor: colors.accentAlt,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  addButtonText: {
    ...typography.labelMedium,
    color: colors.accentAlt,
  },
  saveSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[8],
  },
  saveButton: {
    width: '100%',
  },
});