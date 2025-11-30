import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { supabase } from '../../lib/supabase';
import { LeaderboardUser, Badge } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import BadgeCard from '../profile/BadgeCard';
import UserProfileModal from '../profile/UserProfileModal';

interface LeaderboardProps {
  limit?: number;
  onUserPress?: (userId: string) => void;
}

interface UserWithBadges extends LeaderboardUser {
  badges?: Badge[];
}

export default function Leaderboard({ limit = 5, onUserPress }: LeaderboardProps) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<UserWithBadges[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_leaderboard', {
        limit_count: limit,
      });

      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else if (data) {
        const users = data as LeaderboardUser[];
        
        // Fetch badges for all users
        const userIds = users.map((u) => u.user_id);
        const { data: badgesData } = await supabase
          .from('user_badges')
          .select(`
            user_id,
            badges(*)
          `)
          .in('user_id', userIds);

        // Map badges to users - show only one badge (prioritize exclusive badges)
        const usersWithBadges: UserWithBadges[] = users.map((userData) => {
          const userBadges = badgesData
            ?.filter((b: any) => b.user_id === userData.user_id)
            .map((b: any) => b.badges)
            .filter(Boolean) as Badge[] || [];
          
          // Sort badges: exclusive first, then by name
          const sortedBadges = userBadges.sort((a, b) => {
            if (a.rarity === 'exclusive' && b.rarity !== 'exclusive') return -1;
            if (a.rarity !== 'exclusive' && b.rarity === 'exclusive') return 1;
            return a.display_name.localeCompare(b.display_name);
          });
          
          return {
            ...userData,
            badges: sortedBadges.length > 0 ? [sortedBadges[0]] : [], // Show only first badge
          };
        });

        setLeaderboard(usersWithBadges);
      }
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    // Always open the modal
    setSelectedUserId(userId);
    // Also call the callback if provided (for external handling)
    if (onUserPress) {
      onUserPress(userId);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return 'trophy';
      case 2:
        return 'medal';
      case 3:
        return 'medal-outline';
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return colors.warning;
      case 2:
        return colors.textMuted;
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No leaderboard data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {leaderboard.map((userData, index) => {
          const isCurrentUser = userData.user_id === user?.id;
          const rankIcon = getRankIcon(userData.rank);
          const rankColor = getRankColor(userData.rank);

          return (
            <TouchableOpacity
              key={userData.user_id}
              style={[
                styles.userCard,
                isCurrentUser && styles.currentUserCard,
              ]}
              onPress={() => handleUserPress(userData.user_id)}
              activeOpacity={0.7}
            >
              <View style={styles.rankContainer}>
                {rankIcon ? (
                  <Ionicons name={rankIcon as any} size={24} color={rankColor} />
                ) : (
                  <Text style={[styles.rankText, { color: rankColor }]}>
                    #{userData.rank}
                  </Text>
                )}
              </View>

              <View style={styles.avatarContainer}>
                {userData.avatar_url ? (
                  <Image
                    source={{ uri: userData.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {userData.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                {isCurrentUser && (
                  <View style={styles.currentUserBadge}>
                    <Ionicons name="checkmark" size={12} color={colors.background} />
                  </View>
                )}
              </View>

              <Text style={styles.username} numberOfLines={1}>
                {userData.username || 'Anonymous'}
              </Text>

              {/* Badge - Show only one */}
              {userData.badges && userData.badges.length > 0 && (
                <View style={styles.badgeContainer}>
                  <BadgeCard badge={userData.badges[0]} size="small" />
                </View>
              )}

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="cube" size={14} color={colors.textMuted} />
                  <Text style={styles.statValue}>{userData.total_nfts}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={14} color={colors.textMuted} />
                  <Text style={styles.statValue}>Lv.{userData.level}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          visible={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userId={selectedUserId}
          isOwnProfile={selectedUserId === user?.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingLeft: 0,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  scrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  userCard: {
    width: 120,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  rankContainer: {
    marginBottom: spacing.xs,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: colors.background,
  },
  currentUserBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  username: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.small,
    color: colors.textSecondary,
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});

