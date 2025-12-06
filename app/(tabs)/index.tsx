import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { supabase } from '../../lib/supabase';
import { UserStats, UserNFT, AppUpdate, LeaderboardUser } from '../../types';
import StatCard from '../../components/home/StatCard';
import ProgressBar from '../../components/home/ProgressBar';
import RecentActivity from '../../components/home/RecentActivity';
import StatDetailModal from '../../components/home/StatDetailModal';
import Leaderboard from '../../components/home/Leaderboard';
import UpdatesFeed from '../../components/home/UpdatesFeed';
import UpdateDetailModal from '../../components/home/UpdateDetailModal';
import Button from '../../components/common/Button';

export default function HomeScreen() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentNFTs, setRecentNFTs] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    description?: string;
    iconColor?: string;
    backgroundColor?: string;
    additionalInfo?: { label: string; value: string | number }[];
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [selectedUpdate, setSelectedUpdate] = useState<AppUpdate | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Reset all data first
      setStats(null);
      setRecentNFTs([]);
      setLeaderboard([]);
      setUpdates([]);

      // Fetch all data
      await Promise.all([
        fetchStats(),
        fetchRecentNFTs(),
        fetchUserProfile(),
        fetchLeaderboard(),
        fetchUpdates(),
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }
      // Profile is managed by auth context, but we refresh it here
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        limit_count: 5,
      });

      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else if (data) {
        setLeaderboard(data as LeaderboardUser[]);
      }
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      // First check if section is enabled
      const { data: sectionData, error: sectionError } = await supabase
        .from('app_updates')
        .select('section_enabled')
        .eq('is_active', true)
        .limit(1)
        .single();

      // If section_enabled is false or not set, don't show updates
      if (sectionData?.section_enabled === false) {
        setUpdates([]);
        return;
      }

      const { data, error } = await supabase
        .from('app_updates')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching updates:', error);
      } else if (data) {
        setUpdates(data as AppUpdate[]);
      }
    } catch (error) {
      console.error('Error in fetchUpdates:', error);
    }
  };

  const fetchStats = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stats:', error);
        // Create default stats if they don't exist
        const { data: newStats } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            total_nfts: 0,
            common_count: 0,
            rare_count: 0,
            epic_count: 0,
            legendary_count: 0,
            level: 1,
            experience: 0,
            daily_streak: 0,
            total_distance_km: 0,
            nfts_today: 0,
            nfts_this_week: 0,
            coins: 0,
          })
          .select()
          .single();

        if (newStats) {
          setStats(newStats);
        }
      } else if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error in fetchStats:', error);
    }
  };

  const fetchRecentNFTs = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_nfts')
        .select(`
          *,
          nfts (*)
        `)
        .eq('user_id', user.id)
        .order('collected_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent NFTs:', error);
      } else if (data) {
        // Map Supabase response to UserNFT format
        // Supabase returns "nfts" (plural) but we need "nft" (singular)
        const nfts = (data as any[]).map((item) => ({
          ...item,
          nft: item.nfts || item.nft, // Support both formats
        })) as UserNFT[];
        setRecentNFTs(nfts);
      }
    } catch (error) {
      console.error('Error in fetchRecentNFTs:', error);
    }
  };

  const onRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const minRefreshInterval = 6000; // 6 seconds = 10 refreshes per minute (60/10 = 6)

    if (timeSinceLastRefresh < minRefreshInterval) {
      // Too soon, ignore refresh
      setRefreshing(false);
      return;
    }

    setLastRefreshTime(now);
    fetchData(true);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return colors.textMuted;
      case 'rare':
        return colors.primary;
      case 'epic':
        return colors.secondary;
      case 'legendary':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const calculateXPForNextLevel = () => {
    if (!stats) return 100;
    const currentLevelXP = (stats.level - 1) * 100;
    const nextLevelXP = stats.level * 100;
    return nextLevelXP - currentLevelXP;
  };

  const calculateCurrentLevelXP = () => {
    if (!stats) return 0;
    const currentLevelXP = (stats.level - 1) * 100;
    return stats.experience - currentLevelXP;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentLevelXP = calculateCurrentLevelXP();
  const xpForNextLevel = calculateXPForNextLevel();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || loading} 
            onRefresh={onRefresh} 
            tintColor={colors.primary} 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {userProfile?.avatar_url ? (
                <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#E5E7EB' }]}>
                  <Ionicons name="person" size={40} color="#9CA3AF" />
                </View>
              )}
              {stats && stats.level > 0 && (
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Lv.{stats.level}</Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userProfile?.full_name || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Level & Progress Section */}
        {stats && (
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelTitle}>Level {stats.level}</Text>
              <Text style={styles.xpText}>
                {stats.experience} XP
              </Text>
            </View>
            <ProgressBar
              current={currentLevelXP}
              total={xpForNextLevel}
              height={8}
              showLabel={true}
              backgroundColor="#F3F4F6"
            />
            <Text style={styles.nextLevelText}>
              {xpForNextLevel - currentLevelXP} XP to Level {stats.level + 1}
            </Text>
          </View>
        )}

        {/* Slidable Stats Bar */}
        <View style={styles.statsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
            snapToInterval={176}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            <StatCard
              icon="flame"
              value={stats?.daily_streak || 0}
              label="Day Streak"
              iconColor={colors.warning}
              backgroundColor="#FFF7ED"
              onPress={() =>
                setSelectedStat({
                  icon: 'flame',
                  label: 'Day Streak',
                  value: stats?.daily_streak || 0,
                  description: 'Consecutive days of collecting NFTs',
                  iconColor: colors.warning,
                  backgroundColor: '#FFF7ED',
                  additionalInfo: [
                    { label: 'Last Collection', value: stats?.last_collection_date || 'Never' },
                  ],
                })
              }
            />
            <StatCard
              icon="map"
              value={stats?.total_distance_km ? `${stats.total_distance_km.toFixed(1)} km` : '0 km'}
              label="Distance"
              iconColor={colors.primary}
              backgroundColor="#F3E8FF"
              onPress={() =>
                setSelectedStat({
                  icon: 'map',
                  label: 'Total Distance',
                  value: stats?.total_distance_km ? `${stats.total_distance_km.toFixed(1)} km` : '0 km',
                  description: 'Total distance traveled while collecting NFTs',
                  iconColor: colors.primary,
                  backgroundColor: '#F3E8FF',
                })
              }
            />
            <StatCard
              icon="calendar"
              value={stats?.nfts_today || 0}
              label="Today"
              secondaryValue={`${stats?.nfts_this_week || 0} this week`}
              iconColor={colors.secondary}
              backgroundColor={colors.secondary + '15'}
              onPress={() =>
                setSelectedStat({
                  icon: 'calendar',
                  label: 'Collection Activity',
                  value: `${stats?.nfts_today || 0} today`,
                  description: 'Your NFT collection activity',
                  iconColor: colors.secondary,
                  backgroundColor: colors.secondary + '15',
                  additionalInfo: [
                    { label: 'Today', value: stats?.nfts_today || 0 },
                    { label: 'This Week', value: stats?.nfts_this_week || 0 },
                  ],
                })
              }
            />
            <StatCard
              icon="trophy"
              value={stats?.rank ? `#${stats.rank}` : '—'}
              label="Rank"
              iconColor={colors.warning}
              backgroundColor={colors.warning + '15'}
              onPress={() =>
                setSelectedStat({
                  icon: 'trophy',
                  label: 'Leaderboard Rank',
                  value: stats?.rank ? `#${stats.rank}` : 'Unranked',
                  description: 'Your position on the global leaderboard',
                  iconColor: colors.warning,
                  backgroundColor: colors.warning + '15',
                  additionalInfo: [
                    { label: 'Total NFTs', value: stats?.total_nfts || 0 },
                    { label: 'Level', value: stats?.level || 1 },
                    { label: 'Experience', value: stats?.experience || 0 },
                  ],
                })
              }
            />
            <StatCard
              icon="wallet"
              value={stats?.coins || 0}
              label="Coins"
              iconColor={colors.primary}
              backgroundColor={colors.primary + '15'}
              onPress={() =>
                setSelectedStat({
                  icon: 'wallet',
                  label: 'Coins',
                  value: stats?.coins || 0,
                  description: 'In-game currency earned from collecting NFTs',
                  iconColor: colors.primary,
                  backgroundColor: colors.primary + '15',
                })
              }
            />
            <StatCard
              icon="cube"
              value={stats?.total_nfts || 0}
              label="Total NFTs"
              iconColor={colors.secondary}
              backgroundColor={colors.secondary + '15'}
              onPress={() =>
                setSelectedStat({
                  icon: 'cube',
                  label: 'Total NFTs',
                  value: stats?.total_nfts || 0,
                  description: 'Total NFTs in your collection',
                  iconColor: colors.secondary,
                  backgroundColor: colors.secondary + '15',
                  additionalInfo: [
                    { label: 'Common', value: stats?.common_count || 0 },
                    { label: 'Rare', value: stats?.rare_count || 0 },
                    { label: 'Epic', value: stats?.epic_count || 0 },
                    { label: 'Legendary', value: stats?.legendary_count || 0 },
                  ],
                })
              }
            />
          </ScrollView>
        </View>

        {/* Compact Collection Section */}
        <View style={styles.raritySection}>
          <Text style={styles.sectionTitle}>Your Collection</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rarityScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.rarityCardCompact,
                { backgroundColor: colors.textMuted + '15', borderColor: colors.textMuted },
              ]}
              onPress={() => router.push('/(tabs)/wallet')}
            >
              <Text style={[styles.rarityValueCompact, { color: colors.textMuted }]} numberOfLines={1}>
                {stats?.common_count || 0} Common
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rarityCardCompact,
                { backgroundColor: colors.primary + '15', borderColor: colors.primary },
              ]}
              onPress={() => router.push('/(tabs)/wallet')}
            >
              <Text style={[styles.rarityValueCompact, { color: colors.primary }]} numberOfLines={1}>
                {stats?.rare_count || 0} Rare
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rarityCardCompact,
                { backgroundColor: colors.secondary + '15', borderColor: colors.secondary },
              ]}
              onPress={() => router.push('/(tabs)/wallet')}
            >
              <Text style={[styles.rarityValueCompact, { color: colors.secondary }]} numberOfLines={1}>
                {stats?.epic_count || 0} Epic
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rarityCardCompact,
                { backgroundColor: colors.warning + '15', borderColor: colors.warning },
              ]}
              onPress={() => router.push('/(tabs)/wallet')}
            >
              <Text style={[styles.rarityValueCompact, { color: colors.warning }]} numberOfLines={1}>
                {stats?.legendary_count || 0} Legendary
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <Leaderboard limit={5} onUserPress={(userId) => {
            // Leaderboard component handles UserProfileModal internally
          }} />
        </View>

        {/* Updates/Events Section */}
        {updates.length > 0 && (
          <View style={styles.updatesSection}>
            <Text style={styles.sectionTitle}>Updates & Events</Text>
            <UpdatesFeed
              limit={5}
              onUpdatePress={(update) => setSelectedUpdate(update)}
            />
          </View>
        )}

        {/* Recent Activity Section */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <RecentActivity
            recentNFTs={recentNFTs}
            onPress={(userNFT) => {
              // Navigate to wallet with filter or show NFT details
              router.push('/(tabs)/wallet');
            }}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Explore Map"
            onPress={() => router.push('/(tabs)/map')}
            style={styles.actionButton}
          />
          <Button
            title="View Wallet"
            onPress={() => router.push('/(tabs)/wallet')}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* Stat Detail Modal */}
      {selectedStat && (
        <StatDetailModal
          visible={!!selectedStat}
          onClose={() => setSelectedStat(null)}
          icon={selectedStat.icon}
          label={selectedStat.label}
          value={selectedStat.value}
          description={selectedStat.description}
          iconColor={selectedStat.iconColor}
          backgroundColor={selectedStat.backgroundColor}
          additionalInfo={selectedStat.additionalInfo}
        />
      )}

      {/* Update Detail Modal */}
      <UpdateDetailModal
        visible={!!selectedUpdate}
        onClose={() => setSelectedUpdate(null)}
        update={selectedUpdate}
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
  content: {
    paddingHorizontal: 0,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: colors.background,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.background,
  },
  levelBadgeText: {
    ...typography.small,
    color: colors.background,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  levelSection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelTitle: {
    ...typography.h2,
    color: colors.text,
  },
  xpText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  nextLevelText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsScrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  raritySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rarityScrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  rarityCardCompact: {
    minWidth: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
  },
  rarityValueCompact: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  leaderboardSection: {
    marginBottom: spacing.xl,
  },
  updatesSection: {
    marginBottom: spacing.xl,
  },
  recentSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  actionsContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
});
