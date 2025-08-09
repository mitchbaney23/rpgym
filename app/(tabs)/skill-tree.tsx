import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { ProgressRing } from '../../components/ProgressRing';
import { colors, spacing, radii, layout, skillColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { SKILL_DISPLAY_NAMES, SkillName } from '../../types/domain';
import { getDisplayValue, getNextLevelTarget } from '../../utils/levels';
import * as Haptics from 'expo-haptics';

export default function SkillTreeScreen() {
  const {
    user,
    skills,
    isLoading,
    loadUserData,
  } = useAppStore();

  const handleRefresh = async () => {
    await loadUserData();
  };

  const handleSkillPress = (skillId: SkillName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/skill/${skillId}`);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view your skills</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Skill Tree</Text>
          <Text style={styles.subtitle}>
            Track your progress across all skills
          </Text>
        </View>

        <View style={styles.skillsList}>
          {skills.map((skill) => {
            const nextTarget = getNextLevelTarget(skill.id, skill.level);
            const displayBest = getDisplayValue(skill.id, skill.best);
            
            return (
              <TouchableOpacity
                key={skill.id}
                style={styles.skillCard}
                onPress={() => handleSkillPress(skill.id)}
                activeOpacity={0.7}
              >
                <View style={styles.skillCardContent}>
                  <View style={styles.skillInfo}>
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>
                        {SKILL_DISPLAY_NAMES[skill.id]}
                      </Text>
                      <Text style={[styles.skillLevel, { color: skillColors[skill.id] }]}>
                        Level {skill.level}
                      </Text>
                    </View>
                    
                    <View style={styles.skillStats}>
                      <Text style={styles.skillBest}>
                        Personal Best: {displayBest}
                      </Text>
                      {skill.level < 99 && (
                        <Text style={styles.skillTarget}>
                          Next Level: {getDisplayValue(skill.id, nextTarget)}
                        </Text>
                      )}
                      {skill.level === 99 && (
                        <Text style={styles.maxLevel}>
                          🏆 MAX LEVEL ACHIEVED!
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.skillRing}>
                    <ProgressRing
                      level={skill.level}
                      size={layout.progressRingMedium}
                      color={skillColors[skill.id] || colors.primary}
                      showLevel={true}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {skills.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Skills Found</Text>
            <Text style={styles.emptySubtitle}>
              Skills will appear here once you start tracking your workouts
            </Text>
          </View>
        )}
      </ScrollView>
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
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  skillsList: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  skillCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    padding: spacing[4],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skillCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  skillHeader: {
    marginBottom: spacing[2],
  },
  skillName: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing[1],
  },
  skillLevel: {
    ...typography.labelLarge,
    fontWeight: 'bold',
  },
  skillStats: {},
  skillBest: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  skillTarget: {
    ...typography.caption,
    color: colors.textLight,
  },
  maxLevel: {
    ...typography.caption,
    color: colors.success,
    fontWeight: 'bold',
  },
  skillRing: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
});