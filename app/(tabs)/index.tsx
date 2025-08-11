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
import { StreakFlame } from '../../components/StreakFlame';
import { NeonButton } from '../../components/NeonButton';
import { LevelUpBanner } from '../../components/LevelUpBanner';
import { RetroBackground } from '../../components/RetroBackground';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { colors, spacing } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const {
    user,
    isAuthenticated,
    isLoading,
    levelUpEvent,
    setLevelUpEvent,
    loadUserData,
    crtOverlayEnabled,
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
    scrollViewContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    header: {
      paddingHorizontal: theme.layout.screenPaddingHorizontal,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      alignItems: 'center',
    },
    greeting: {
      ...theme.typography.h2,
      fontSize: 20,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    overallLevelCard: {
      backgroundColor: theme.colors.panel,
      borderRadius: theme.radii.xl,
      marginTop: theme.spacing.sm,
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
      ...theme.typography.labelLarge,
      fontSize: 14,
      marginBottom: theme.spacing.xs,
    },
    overallLevel: {
      ...theme.typography.numberHuge,
      fontSize: 42,
      color: theme.colors.accentAlt,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    overallLevelSubtext: {
      ...theme.typography.body,
      fontSize: 16,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    streakSection: {
      alignItems: 'center',
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.layout.screenPaddingHorizontal,
    },
    streakDescription: {
      ...theme.typography.labelLarge,
      fontSize: 14,
      marginTop: theme.spacing.sm,
    },
    actionSection: {
      paddingHorizontal: theme.layout.screenPaddingHorizontal,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    logPRButton: {
      width: '90%',
      maxWidth: 400,
      height: 60,
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
      <RetroBackground showScanlines={crtOverlayEnabled}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>PLEASE SIGN IN TO CONTINUE</Text>
        </SafeAreaView>
      </RetroBackground>
    );
  }

  return (
    <RetroBackground showScanlines={crtOverlayEnabled}>
      <SafeAreaView style={styles.container}>
        <LevelUpBanner
          levelUpEvent={levelUpEvent}
          onDismiss={handleLevelUpDismiss}
        />
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={handleRefresh}
              tintColor={colors.accentAlt}
              colors={[colors.accentAlt]}
            />
          }
        >
        {/* Overall Level Section at Top */}
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


        {/* Centered Log PR Button */}
        <View style={styles.actionSection}>
          <NeonButton
            title="LOG PR"
            onPress={handleLogPR}
            size="large"
            style={styles.logPRButton}
          />
        </View>

        {/* Daily Streak Below Button */}
        <View style={styles.streakSection}>
          <StreakFlame
            streakCount={user.streakCount}
            size={90}
            showText={true}
          />
          <Text style={styles.streakDescription}>
            DAILY STREAK
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </RetroBackground>
  );
}
