import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { logOut } from '../../lib/auth';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { colors, spacing, radii, layout } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { MILESTONE_LEVELS, SKILLS, SKILL_DISPLAY_NAMES } from '../../types/domain';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const {
    user,
    skills,
    badges,
    isLoading,
    loadUserData,
    clearStore,
  } = useAppStore();

  const handleRefresh = async () => {
    await loadUserData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logOut();
              clearStore();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShareCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/share-card');
  };

  type BadgeGridItem = {
    id: string;
    label: string;
    skillId: string;
    level: number;
    isUnlocked: boolean;
    badge?: import('../../types/domain').Badge;
  };

  const generateBadgeGrid = () => {
    const allPossibleBadges: BadgeGridItem[] = [];
    
    // Generate milestone badges for each skill
    SKILLS.forEach(skillId => {
      MILESTONE_LEVELS.forEach(level => {
        const skill = skills.find(s => s.id === skillId);
        const isUnlocked = badges.some(badge => 
          badge.skillId === skillId && badge.level === level
        );
        const unlockedBadge = badges.find(badge => 
          badge.skillId === skillId && badge.level === level
        );
        
        allPossibleBadges.push({
          id: `${skillId}-${level}`,
          skillId,
          level,
          isUnlocked,
          badge: unlockedBadge,
          label: level === 99 ? `${SKILL_DISPLAY_NAMES[skillId]} L99—Golden` : `${SKILL_DISPLAY_NAMES[skillId]} L${level}`,
        });
      });
    });

    return allPossibleBadges;
  };

  const badgeGrid = generateBadgeGrid();
  const unlockedBadges = badgeGrid.filter(item => item.isUnlocked);
  const totalBadges = badgeGrid.length;

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view your profile</Text>
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
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.overallLevel}</Text>
            <Text style={styles.statLabel}>Overall Level</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.streakCount}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{unlockedBadges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        <View style={styles.badgeSection}>
          <View style={styles.badgeHeader}>
            <Text style={styles.sectionTitle}>Badge Collection</Text>
            <Text style={styles.badgeProgress}>
              {unlockedBadges.length} / {totalBadges}
            </Text>
          </View>
          
          <View style={styles.badgeGrid}>
            {badgeGrid.map((item) => (
              <Badge
                key={item.id}
                badge={item.badge}
                size={layout.badgeMedium}
                showLabel={false}
                locked={!item.isUnlocked}
              />
            ))}
          </View>
          
          {unlockedBadges.length === 0 && (
            <View style={styles.emptyBadges}>
              <Text style={styles.emptyBadgesText}>
                Start logging personal records to unlock badges!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionSection}>
          <Button
            title="Share Achievement Card"
            onPress={handleShareCard}
            variant="secondary"
            style={styles.shareButton}
          />
          
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
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
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  displayName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing[1],
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[8],
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    ...typography.stat,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  badgeSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[8],
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  badgeProgress: {
    ...typography.body,
    color: colors.textSecondary,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyBadges: {
    backgroundColor: colors.white,
    padding: spacing[8],
    borderRadius: radii.lg,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyBadgesText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  shareButton: {
    marginBottom: spacing[2],
  },
  logoutButton: {},
});