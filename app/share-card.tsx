import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../lib/store';
import { Button } from '../components/Button';
import { ProgressRing } from '../components/ProgressRing';
import { StreakFlame } from '../components/StreakFlame';
import { colors, spacing, radii, layout, skillColors } from '../theme/tokens';
import { typography } from '../theme/typography';
import { SKILL_DISPLAY_NAMES } from '../types/domain';
import * as Haptics from 'expo-haptics';

export default function ShareCardScreen() {
  const { user, skills, badges } = useAppStore();

  const handleClose = () => {
    router.back();
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Share Feature',
      'Share functionality would be implemented here using expo-sharing or similar libraries to share a screenshot of this card.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to share your achievements</Text>
      </SafeAreaView>
    );
  }

  const unlockedBadgesCount = badges.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="✕ Close"
          variant="ghost"
          size="small"
          onPress={handleClose}
          style={styles.closeButton}
        />
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.shareCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.appTitle}>RPGym</Text>
            <Text style={styles.userName}>{user.displayName}</Text>
          </View>

          <View style={styles.cardStats}>
            <View style={styles.mainStat}>
              <Text style={styles.overallLevel}>{user.overallLevel}</Text>
              <Text style={styles.overallLevelLabel}>Overall Level</Text>
            </View>

            <View style={styles.secondaryStats}>
              <View style={styles.statItem}>
                <StreakFlame streakCount={user.streakCount} size={40} showText={false} />
                <Text style={styles.statValue}>{user.streakCount}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.badgeEmoji}>🏆</Text>
                <Text style={styles.statValue}>{unlockedBadgesCount}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>
          </View>

          <View style={styles.skillsPreview}>
            <Text style={styles.skillsTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {skills.slice(0, 5).map((skill) => (
                <View key={skill.id} style={styles.skillPreview}>
                  <ProgressRing
                    level={skill.level}
                    size={50}
                    color={skillColors[skill.id] || colors.primary}
                    showLevel={true}
                  />
                  <Text style={styles.skillPreviewName}>
                    {SKILL_DISPLAY_NAMES[skill.id]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>
              Level up your fitness journey with RPGym
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Share Achievement Card"
          onPress={handleShare}
          size="large"
          style={styles.shareButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
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
  header: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  shareCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[6],
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  appTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  userName: {
    ...typography.h2,
    color: colors.text,
  },
  cardStats: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  overallLevel: {
    ...typography.statLarge,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  overallLevelLabel: {
    ...typography.labelLarge,
    color: colors.textSecondary,
  },
  secondaryStats: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  statItem: {
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: spacing[1],
  },
  statValue: {
    ...typography.statSmall,
    color: colors.text,
    marginBottom: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  skillsPreview: {
    marginBottom: spacing[6],
  },
  skillsTitle: {
    ...typography.h5,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  skillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  skillPreview: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  skillPreviewName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing[1],
    textAlign: 'center',
    maxWidth: 60,
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[6],
  },
  shareButton: {
    width: '100%',
  },
});