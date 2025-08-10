import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { logPersonalRecord, updateStreak } from '../../lib/firestore';
import { ProgressRing } from '../../components/ProgressRing';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { colors, spacing, radii, layout, skillColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { SKILL_DISPLAY_NAMES, SkillName, SKILL_UNITS } from '../../types/domain';
import { getDisplayValue, getNextLevelTarget, parseTime, formatTime } from '../../utils/levels';
import * as Haptics from 'expo-haptics';

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams();
  const skillId = id as SkillName;
  
  const {
    user,
    skills,
    setLevelUpEvent,
    loadUserData,
  } = useAppStore();
  
  const [prValue, setPRValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const skill = skills.find(s => s.id === skillId);

  useEffect(() => {
    if (!skill && user) {
      loadUserData();
    }
  }, [skillId, skill, user]);

  const validateInput = (value: string): number | null => {
    if (!value.trim()) {
      setError(`${SKILL_DISPLAY_NAMES[skillId]} value is required`);
      return null;
    }

    if (skillId === '5k') {
      // Parse time format (MM:SS)
      const seconds = parseTime(value);
      if (seconds <= 0) {
        setError('Please enter a valid time in MM:SS format (e.g., 25:30)');
        return null;
      }
      if (seconds > 7200) { // 2 hours max
        setError('Time must be less than 2 hours');
        return null;
      }
      return seconds;
    } else {
      // Parse reps
      const reps = parseInt(value, 10);
      if (isNaN(reps) || reps <= 0) {
        setError('Please enter a valid number of reps');
        return null;
      }
      if (reps > 10000) {
        setError('Please enter a realistic number of reps');
        return null;
      }
      return reps;
    }
  };

  const handleLogPR = async () => {
    if (!user || !skill) return;

    const validatedValue = validateInput(prValue);
    if (validatedValue === null) return;

    // Check if this is actually a PR
    if (skillId === '5k') {
      // For 5k, lower time is better
      if (skill.best > 0 && validatedValue >= skill.best) {
        Alert.alert(
          'Not a Personal Record',
          `Your current best is ${formatTime(skill.best)}. You need to run faster to set a new PR!`
        );
        return;
      }
    } else {
      // For other exercises, higher reps is better
      if (validatedValue <= skill.best) {
        Alert.alert(
          'Not a Personal Record', 
          `Your current best is ${skill.best} reps. You need to do more to set a new PR!`
        );
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const result = await logPersonalRecord(user.uid, skillId, validatedValue);
      
      // Update streak
      await updateStreak(user.uid);
      
      // Show level up banner if applicable
      if (result.levelUp) {
        setLevelUpEvent({
          skillId,
          newLevel: result.newLevel,
          previousLevel: result.newLevel - 1,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Refresh data
      await loadUserData();
      
      // Clear form
      setPRValue('');
      
      Alert.alert(
        'Personal Record Logged!',
        result.levelUp 
          ? `🎉 Congratulations! You've reached Level ${result.newLevel} in ${SKILL_DISPLAY_NAMES[skillId]}!`
          : `Great job! Your new ${SKILL_DISPLAY_NAMES[skillId]} PR has been recorded.`
      );

    } catch (error) {
      console.error('Error logging PR:', error);
      Alert.alert('Error', 'Failed to log personal record. Please try again.');
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view skill details</Text>
      </SafeAreaView>
    );
  }

  if (!skill) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading skill data...</Text>
      </SafeAreaView>
    );
  }

  const displayBest = getDisplayValue(skillId, skill.best);
  const nextTarget = getNextLevelTarget(skillId, skill.level);
  const displayTarget = skill.level < 99 ? getDisplayValue(skillId, nextTarget) : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Button
              title="← Back"
              variant="ghost"
              size="small"
              onPress={() => router.back()}
              style={styles.backButton}
            />
            
            <Text style={styles.title}>
              {SKILL_DISPLAY_NAMES[skillId]}
            </Text>
          </View>

          <View style={styles.skillOverview}>
            <ProgressRing
              level={skill.level}
              size={layout.progressRingLarge + 20}
              color={skillColors[skillId] || colors.primary}
              showLevel={true}
            />
            
            <View style={styles.skillStats}>
              <Text style={[styles.currentLevel, { color: skillColors[skillId] }]}>
                Level {skill.level}
              </Text>
              
              <Text style={styles.currentBest}>
                Personal Best: {displayBest}
              </Text>
              
              {displayTarget && (
                <Text style={styles.nextTarget}>
                  Next Level: {displayTarget}
                </Text>
              )}
              
              {skill.level === 99 && (
                <Text style={styles.maxLevel}>
                  🏆 MAX LEVEL ACHIEVED!
                </Text>
              )}
            </View>
          </View>

          <View style={styles.logPRSection}>
            <Text style={styles.sectionTitle}>Log New Personal Record</Text>
            
            <TextInput
              label={`${SKILL_DISPLAY_NAMES[skillId]} ${skillId === '5k' ? '(MM:SS)' : '(reps)'}`}
              placeholder={skillId === '5k' ? 'e.g., 25:30' : 'e.g., 50'}
              value={prValue}
              onChangeText={(text) => {
                setPRValue(text);
                setError('');
              }}
              error={error}
              keyboardType={skillId === '5k' ? 'default' : 'numeric'}
            />
            
            <Button
              title="Log PR"
              onPress={handleLogPR}
              loading={loading}
              disabled={!prValue.trim()}
              style={styles.logButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing[4],
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  skillOverview: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[8],
  },
  skillStats: {
    alignItems: 'center',
    marginTop: spacing[6],
  },
  currentLevel: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing[2],
  },
  currentBest: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  nextTarget: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: spacing[1],
  },
  maxLevel: {
    ...typography.body,
    color: colors.success,
    fontWeight: 'bold',
  },
  logPRSection: {
    backgroundColor: colors.bg,
    marginHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[6],
    padding: spacing[6],
    borderRadius: radii.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  logButton: {
    marginTop: spacing[4],
  },
});