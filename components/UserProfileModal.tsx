import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { ProgressRing } from './ProgressRing';
import { colors, spacing, radii, layout, skillColors } from '../theme/tokens';
import { typography } from '../theme/typography';
import { SKILL_DISPLAY_NAMES } from '../types/domain';
import type { LeaderboardEntry } from '../utils/leaderboard';
import type { Skill } from '../types/domain';
import { getDisplayValue } from '../utils/levels';

interface UserProfileModalProps {
  visible: boolean;
  user: LeaderboardEntry | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  user,
  onClose,
}) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadUserSkills();
    }
  }, [visible, user]);

  const loadUserSkills = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // For now, generate mock skills data for demo users
      // TODO: Replace with real Firestore query when rules are updated
      if (user.uid.startsWith('user')) {
        const mockSkills = generateMockSkills(user.overallLevel);
        setSkills(mockSkills);
      } else {
        // Try to load real user skills
        const skillsSnapshot = await getDocs(
          collection(firestore, 'users', user.uid, 'skills')
        );
        
        const skillsData = skillsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Skill[];

        setSkills(skillsData);
      }
    } catch (error) {
      console.error('Error loading user skills:', error);
      // Fallback to mock data
      const mockSkills = generateMockSkills(user.overallLevel);
      setSkills(mockSkills);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSkills = (overallLevel: number): Skill[] => {
    // Generate realistic skill levels that average to the overall level
    const baseLevel = overallLevel;
    const variance = Math.floor(baseLevel * 0.3); // 30% variance
    
    return [
      {
        id: 'pushups',
        name: 'pushups',
        level: Math.max(0, Math.min(99, baseLevel + Math.floor(Math.random() * variance * 2 - variance))),
        best: Math.floor(Math.random() * 50) + baseLevel,
        lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
      {
        id: 'situps',
        name: 'situps', 
        level: Math.max(0, Math.min(99, baseLevel + Math.floor(Math.random() * variance * 2 - variance))),
        best: Math.floor(Math.random() * 60) + baseLevel,
        lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
      {
        id: 'squats',
        name: 'squats',
        level: Math.max(0, Math.min(99, baseLevel + Math.floor(Math.random() * variance * 2 - variance))),
        best: Math.floor(Math.random() * 40) + baseLevel,
        lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
      {
        id: 'pullups',
        name: 'pullups',
        level: Math.max(0, Math.min(99, baseLevel + Math.floor(Math.random() * variance * 2 - variance))),
        best: Math.floor(Math.random() * 15) + Math.floor(baseLevel / 5),
        lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
      {
        id: '5k',
        name: '5k',
        level: Math.max(0, Math.min(99, baseLevel + Math.floor(Math.random() * variance * 2 - variance))),
        best: 3600 - (baseLevel * 21) + Math.floor(Math.random() * 300), // Realistic 5k times
        lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    ];
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{user.displayName}</Text>
            <Text style={styles.subtitle}>Skill Breakdown</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>L{user.overallLevel}</Text>
                <Text style={styles.summaryLabel}>Overall Level</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{user.streakCount}</Text>
                <Text style={styles.summaryLabel}>Streak</Text>
              </View>
              {user.totalBadges !== undefined && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{user.totalBadges}</Text>
                  <Text style={styles.summaryLabel}>Badges</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.skillsSection}>
            <Text style={styles.sectionTitle}>Individual Skills</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading skills...</Text>
              </View>
            ) : skills.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No skill data available for this user
                </Text>
              </View>
            ) : (
              <View style={styles.skillsGrid}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillCard}>
                    <View style={styles.skillHeader}>
                      <ProgressRing
                        level={skill.level}
                        size={80}
                        color={skillColors[skill.id] || colors.primary}
                        showLevel={true}
                      />
                    </View>
                    <View style={styles.skillInfo}>
                      <Text style={styles.skillName}>
                        {SKILL_DISPLAY_NAMES[skill.id]}
                      </Text>
                      <Text style={styles.skillLevel}>Level {skill.level}</Text>
                      <Text style={styles.skillBest}>
                        Best: {getDisplayValue(skill.id, skill.best)}
                      </Text>
                      {skill.lastUpdated && (
                        <Text style={styles.skillDate}>
                          Updated: {new Date(skill.lastUpdated.seconds * 1000).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing[2],
    borderRadius: radii.xl,
    backgroundColor: colors.border,
  },
  closeButtonText: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.bg,
    margin: layout.screenPaddingHorizontal,
    borderRadius: radii.xl,
    padding: spacing[6],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.statLarge,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillsSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[4],
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing[4],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  skillsGrid: {
    gap: spacing[4],
  },
  skillCard: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skillHeader: {
    marginRight: spacing[4],
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    ...typography.labelLarge,
    color: colors.text,
    marginBottom: spacing[1],
  },
  skillLevel: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing[1],
  },
  skillBest: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  skillDate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});