import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../../lib/store';
import { fetchLeaderboard } from '../../utils/leaderboard-example';
import { colors, spacing, radii, layout } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import type { LeaderboardEntry } from '../../utils/leaderboard';
import { UserProfileModal } from '../../components/UserProfileModal';
import { formatLevelDisplay } from '../../utils/leaderboard';

export default function LeaderboardScreen() {
  const { user, isAuthenticated } = useAppStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadLeaderboard();
    }
  }, [isAuthenticated]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await fetchLeaderboard(50); // Get top 50 users
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = (entry: LeaderboardEntry) => {
    setSelectedUser(entry);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  const getUserRank = () => {
    if (!user) return -1;
    const userIndex = leaderboard.findIndex(entry => entry.uid === user.uid);
    return userIndex === -1 ? -1 : userIndex + 1;
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>
            Please sign in to view the leaderboard
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadLeaderboard} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          {user && (
            <Text style={styles.userRank}>
              Your Rank: {getUserRank() === -1 ? 'Unranked' : `#${getUserRank()}`}
            </Text>
          )}
        </View>

        {isLoading && leaderboard.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No competitors yet. Be the first to level up!
            </Text>
          </View>
        ) : (
          <View style={styles.leaderboardContainer}>
            {leaderboard.map((entry, index) => (
              <TouchableOpacity
                key={entry.uid}
                style={[
                  styles.leaderboardItem,
                  entry.uid === user?.uid && styles.currentUserItem,
                  index < 3 && styles.topThreeItem,
                ]}
                onPress={() => handleUserPress(entry)}
              >
                <View style={styles.rankContainer}>
                  <Text style={[
                    styles.rank,
                    index < 3 && styles.topThreeRank
                  ]}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                  </Text>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={[
                    styles.displayName,
                    entry.uid === user?.uid && styles.currentUserName
                  ]}>
                    {entry.displayName}
                    {entry.uid === user?.uid && ' (You)'}
                  </Text>
                  <View style={styles.statsRow}>
                    <Text style={styles.levelText}>
                      {formatLevelDisplay(entry.overallLevel)}
                    </Text>
                    <Text style={styles.streakText}>
                      🔥 {entry.streakCount}
                    </Text>
                    {entry.totalBadges !== undefined && (
                      <Text style={styles.badgeText}>
                        🏅 {entry.totalBadges}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.chevron}>
                  <Text style={styles.chevronText}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <UserProfileModal
        visible={modalVisible}
        user={selectedUser}
        onClose={handleModalClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: spacing[2],
  },
  userRank: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  notAuthenticatedText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  leaderboardContainer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserItem: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryBackground,
  },
  topThreeItem: {
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
  },
  topThreeRank: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  displayName: {
    ...typography.labelLarge,
    color: colors.text,
    marginBottom: spacing[1],
  },
  currentUserName: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: spacing[3],
  },
  streakText: {
    ...typography.caption,
    color: colors.error,
    marginRight: spacing[3],
  },
  badgeText: {
    ...typography.caption,
    color: colors.warning,
  },
  chevron: {
    paddingLeft: spacing[2],
  },
  chevronText: {
    ...typography.h4,
    color: colors.textSecondary,
  },
});