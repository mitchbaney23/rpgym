import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore, initializeAuth } from '../../lib/store';
import { ProgressRing } from '../../components/ProgressRing';
import { StreakFlame } from '../../components/StreakFlame';
import { NeonButton } from '../../components/NeonButton';
import { LevelUpBanner } from '../../components/LevelUpBanner';
import { RetroBackground } from '../../components/RetroBackground';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { colors, spacing, skillColors } from '../../theme/tokens';
import { SKILL_DISPLAY_NAMES } from '../../types/domain';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const {
    user,
    isAuthenticated,
    isLoading,
    skills,
    levelUpEvent,
    setLevelUpEvent,
    loadUserData,
  } = useAppStore();

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...theme.typography.body,
      color: theme.colors.textDim,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.layout.screenPaddingHorizontal,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    greeting: {
      ...theme.typography.h2,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    overallLevelCard: {
      backgroundColor: theme.colors.panel,
      borderRadius: theme.radii.xl,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.stroke,
      shadowColor: theme.colors.accentAlt,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    overallLevelContainer: {
      alignItems: 'center',
    },
    overallLevelLabel: {
      ...theme.typography.label,
      marginBottom: theme.spacing.xs,
    },
    overallLevel: {
      ...theme.typography.numberHuge,
      color: theme.colors.accentAlt,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    overallLevelSubtext: {
      ...theme.typography.bodySmall,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    streakSection: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.layout.screenPaddingHorizontal,
    },
    streakDescription: {
      ...theme.typography.label,
      marginTop: theme.spacing.sm,
    },
    skillsSection: {
      paddingHorizontal: theme.layout.screenPaddingHorizontal,
      paddingVertical: theme.spacing.xl,
    },
    sectionTitle: {
      ...theme.typography.h3,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
    },
    skillItem: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      width: '45%',
    },
    skillName: {
      ...theme.typography.labelLarge,
      fontSize: 14,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
      color: theme.colors.text,
      textShadowColor: '#000',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    skillBest: {
      ...theme.typography.caption,
      fontSize: 12,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
      color: theme.colors.text,
      opacity: 0.9,
      textShadowColor: '#000',
      textShadowOffset: { width: 0, height: 0.5 },
      textShadowRadius: 1,
    },
    actionSection: {
      paddingHorizontal: theme.layout.screenPaddingHorizontal,
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
    },
    logPRButton: {
      width: '100%',
      maxWidth: 300,
    },
    loadingSkills: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xxl,
    },
    emptySkills: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xxl,
    },
    emptySkillsText: {
      ...theme.typography.body,
      color: theme.colors.textDim,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    refreshButton: {
      marginTop: theme.spacing.sm,
    },
  }));

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  const handleRefresh = async () => {
    await loadUserData();
  };

  const handleLogPR = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // For now, just navigate to skill tree to select a skill
    router.push('/(tabs)/skill-tree');
  };

  const handleLevelUpDismiss = () => {
    setLevelUpEvent(null);
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

  if (!user) {
    return (
      <RetroBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>PLEASE SIGN IN TO CONTINUE</Text>
        </SafeAreaView>
      </RetroBackground>
    );
  }

  return (
    <RetroBackground>
      <SafeAreaView style={styles.container}>
        <LevelUpBanner
          levelUpEvent={levelUpEvent}
          onDismiss={handleLevelUpDismiss}
        />
        
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={handleRefresh}
              tintColor={colors.accentAlt}
              colors={[colors.accentAlt]}
            />
          }
        >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            WELCOME BACK, {user.displayName?.toUpperCase()}!
          </Text>
          
          <View style={styles.overallLevelCard}>
            <View style={styles.overallLevelContainer}>
              <Text style={styles.overallLevelLabel}>OVERALL LEVEL</Text>
              <Text style={styles.overallLevel}>{user.overallLevel}</Text>
              <Text style={styles.overallLevelSubtext}>
                {user.overallLevel === 0 ? 'START YOUR JOURNEY!' :
                 user.overallLevel >= 90 ? '👑 ELITE FIGHTER!' :
                 user.overallLevel >= 50 ? '⭐ ADVANCED PLAYER' :
                 user.overallLevel >= 20 ? '🔥 GETTING STRONG' :
                 '💪 BUILDING POWER'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.streakSection}>
          <StreakFlame
            streakCount={user.streakCount}
            size={80}
            showText={true}
          />
          <Text style={styles.streakDescription}>
            DAILY STREAK
          </Text>
        </View>

        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>YOUR SKILLS</Text>
          {isLoading && skills.length === 0 ? (
            <View style={styles.loadingSkills}>
              <Text style={styles.loadingText}>LOADING YOUR SKILLS...</Text>
            </View>
          ) : skills.length === 0 ? (
            <View style={styles.emptySkills}>
              <Text style={styles.emptySkillsText}>
                INITIALIZING YOUR FITNESS JOURNEY...
              </Text>
              <NeonButton
                title="REFRESH"
                onPress={handleRefresh}
                variant="outline"
                size="small"
                style={styles.refreshButton}
              />
            </View>
          ) : (
            <View style={styles.skillsGrid}>
              {skills.map((skill) => (
                <View key={skill.id} style={styles.skillItem}>
                  <ProgressRing
                    level={skill.level}
                    size={100}
                    color={skillColors[skill.id] || colors.accentAlt}
                    showLevel={true}
                  />
                  <Text style={styles.skillName}>
                    {SKILL_DISPLAY_NAMES[skill.id].toUpperCase()}
                  </Text>
                  <Text style={styles.skillBest}>
                    BEST: {skill.best || 0}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actionSection}>
          <NeonButton
            title="LOG PR"
            onPress={handleLogPR}
            size="large"
            style={styles.logPRButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  </RetroBackground>
  );
}
