import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User, UserStats, Badge, UserBadge } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import BadgeList from './BadgeList';
import FireAnimation from './FireAnimation';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  isOwnProfile?: boolean;
}

export default function UserProfileModal({
  visible,
  onClose,
  userId,
  isOwnProfile = false,
}: UserProfileModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && userId) {
      fetchProfileData();
      // Animate slide up
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Trigger fire animation after a short delay
      setTimeout(() => {
        setShowFireAnimation(true);
        // Hide fire animation after 1 second
        setTimeout(() => {
          setShowFireAnimation(false);
        }, 1000);
      }, 300);
    } else {
      // Reset animations
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      setShowFireAnimation(false);
    }
  }, [visible, userId]);

  const fetchProfileData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError);
      } else if (userData) {
        setUser(userData as User);
      }

      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError);
      } else if (statsData) {
        setStats(statsData as UserStats);
      }

      // Fetch user badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges(*)
        `)
        .eq('user_id', userId);

      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
      } else if (badgesData) {
        const userBadges = badgesData as (UserBadge & { badges: Badge })[];
        setBadges(userBadges.map((ub) => ub.badges).filter(Boolean) as Badge[]);
      }
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleXLink = () => {
    if (user?.x_username) {
      const xUrl = `https://x.com/${user.x_username}`;
      Linking.openURL(xUrl).catch((err) => {
        console.error('Error opening X link:', err);
      });
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            {/* Header - Fixed */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchProfileData(true)}
                    tintColor={colors.primary}
                  />
                }
              >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <View style={styles.avatarContainer}>
                    {user?.avatar_url ? (
                      <Image
                        source={{ uri: user.avatar_url }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {user?.full_name?.[0]?.toUpperCase() ||
                            user?.username?.[0]?.toUpperCase() ||
                            'U'}
                        </Text>
                      </View>
                    )}
                    {/* Badge overlay on avatar */}
                    {badges.length > 0 && badges[0].rarity === 'exclusive' && (
                      <View style={styles.exclusiveBadgeOverlay}>
                        <Ionicons
                          name="star"
                          size={16}
                          color={badges[0].color}
                        />
                        {/* Fire animation on profile open */}
                        {showFireAnimation && (
                          <FireAnimation visible={showFireAnimation} duration={1000} />
                        )}
                      </View>
                    )}
                  </View>

                  <Text style={styles.username}>
                    {user?.username || 'Anonymous'}
                  </Text>
                  {user?.full_name && (
                    <Text style={styles.fullName}>{user.full_name}</Text>
                  )}

                  {/* X Link */}
                  {user?.x_username && (
                    <TouchableOpacity
                      style={styles.xLink}
                      onPress={handleXLink}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-twitter" size={16} color={colors.primary} />
                      <Text style={styles.xLinkText}>@{user.x_username}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Description */}
                  {user?.description && (
                    <Text style={styles.description}>{user.description}</Text>
                  )}

                  {/* Join Date */}
                  {user?.created_at && (
                    <Text style={styles.joinDate}>
                      Joined {formatJoinDate(user.created_at)}
                    </Text>
                  )}
                </View>

                {/* Stats Section */}
                {stats && (
                  <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Stats</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.total_nfts}</Text>
                        <Text style={styles.statLabel}>NFTs</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statValue}>Lv.{stats.level}</Text>
                        <Text style={styles.statLabel}>Level</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.experience}</Text>
                        <Text style={styles.statLabel}>XP</Text>
                      </View>
                      {stats.rank && (
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>#{stats.rank}</Text>
                          <Text style={styles.statLabel}>Rank</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Collection Breakdown */}
                {stats && (
                  <View style={styles.collectionSection}>
                    <Text style={styles.sectionTitle}>Collection</Text>
                    <View style={styles.rarityGrid}>
                      <View
                        style={[
                          styles.rarityCard,
                          { backgroundColor: colors.textMuted + '20' },
                        ]}
                      >
                        <Text
                          style={[styles.rarityValue, { color: colors.textMuted }]}
                        >
                          {stats.common_count}
                        </Text>
                        <Text style={styles.rarityLabel}>Common</Text>
                      </View>
                      <View
                        style={[
                          styles.rarityCard,
                          { backgroundColor: colors.rareLight },
                        ]}
                      >
                        <Text
                          style={[styles.rarityValue, { color: colors.rare }]}
                        >
                          {stats.rare_count}
                        </Text>
                        <Text style={styles.rarityLabel}>Rare</Text>
                      </View>
                      <View
                        style={[
                          styles.rarityCard,
                          { backgroundColor: colors.secondary + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rarityValue,
                            { color: colors.secondary },
                          ]}
                        >
                          {stats.epic_count}
                        </Text>
                        <Text style={styles.rarityLabel}>Epic</Text>
                      </View>
                      <View
                        style={[
                          styles.rarityCard,
                          { backgroundColor: colors.warning + '20' },
                        ]}
                      >
                        <Text
                          style={[styles.rarityValue, { color: colors.warning }]}
                        >
                          {stats.legendary_count}
                        </Text>
                        <Text style={styles.rarityLabel}>Legendary</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Badges Section */}
                <View style={styles.badgesSection}>
                  <Text style={styles.sectionTitle}>Badges</Text>
                  <BadgeList badges={badges} />
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
    height: '100%',
  },
  safeAreaBottom: {
    height: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarText: {
    ...typography.h1,
    color: colors.background,
  },
  exclusiveBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  username: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fullName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  xLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    gap: spacing.xs,
  },
  xLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  joinDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  collectionSection: {
    marginBottom: spacing.xl,
  },
  rarityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rarityCard: {
    width: '48%',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  rarityValue: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  rarityLabel: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.9,
  },
  badgesSection: {
    marginBottom: spacing.xl,
  },
});

