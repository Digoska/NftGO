import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { UserStats, Badge } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Button from '../../components/common/Button';
import BadgeList from '../../components/profile/BadgeList';
import UserProfileModal from '../../components/profile/UserProfileModal';

export default function ProfileScreen() {
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchBadges();
    }
  }, [user]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges(*)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching badges:', error);
      } else if (data) {
        const userBadges = data as any[];
        setBadges(userBadges.map((ub) => ub.badges).filter(Boolean) as Badge[]);
      }
    } catch (error) {
      console.error('Error in fetchBadges:', error);
    }
  };

  const handleXLink = () => {
    if (userProfile?.x_username) {
      const xUrl = `https://x.com/${userProfile.x_username}`;
      Linking.openURL(xUrl).catch((err) => {
        console.error('Error opening X link:', err);
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Section with Gradient Background */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {userProfile?.avatar_url ? (
                <Image
                  source={{ uri: userProfile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userProfile?.full_name?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      'U'}
                  </Text>
                </View>
              )}
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Lv.{stats?.level || 1}</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userProfile?.full_name || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {userProfile?.x_username && (
                <TouchableOpacity
                  style={styles.xLink}
                  onPress={handleXLink}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-twitter" size={14} color={colors.primary} />
                  <Text style={styles.xLinkText}>@{userProfile.x_username}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/(tabs)/edit-profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        {userProfile?.description && (
          <View style={styles.descriptionContainer}>
            <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} style={styles.descriptionIcon} />
            <Text style={styles.description}>{userProfile.description}</Text>
          </View>
        )}
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="images" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.total_nfts || 0}</Text>
            <Text style={styles.statLabel}>Total NFTs</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.level || 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.experience || 0}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>
      </View>

      {/* Badges Section */}
      {badges.length > 0 && (
        <View style={styles.badgesContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Badges</Text>
          </View>
          <BadgeList badges={badges} />
        </View>
      )}

      <View style={styles.rarityContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="grid" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Collection Breakdown</Text>
        </View>
        <View style={styles.rarityGrid}>
          <View style={[styles.rarityCard, styles.commonCard]}>
            <View style={styles.rarityIconContainer}>
              <Ionicons name="ellipse" size={12} color={colors.textMuted} />
            </View>
            <Text style={styles.rarityValue}>{stats?.common_count || 0}</Text>
            <Text style={styles.rarityLabel}>Common</Text>
          </View>
          <View style={[styles.rarityCard, styles.rareCard]}>
            <View style={styles.rarityIconContainer}>
              <Ionicons name="ellipse" size={12} color={colors.primary} />
            </View>
            <Text style={styles.rarityValue}>{stats?.rare_count || 0}</Text>
            <Text style={styles.rarityLabel}>Rare</Text>
          </View>
          <View style={[styles.rarityCard, styles.epicCard]}>
            <View style={styles.rarityIconContainer}>
              <Ionicons name="ellipse" size={12} color={colors.secondary} />
            </View>
            <Text style={styles.rarityValue}>{stats?.epic_count || 0}</Text>
            <Text style={styles.rarityLabel}>Epic</Text>
          </View>
          <View style={[styles.rarityCard, styles.legendaryCard]}>
            <View style={styles.rarityIconContainer}>
              <Ionicons name="ellipse" size={12} color={colors.warning} />
            </View>
            <Text style={styles.rarityValue}>{stats?.legendary_count || 0}</Text>
            <Text style={styles.rarityLabel}>Legendary</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(tabs)/privacy-policy')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(tabs)/terms-of-service')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(tabs)/about')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Button
        title="Log Out"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutButton}
      />

      {/* Profile Modal */}
      {user && (
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={user.id}
          isOwnProfile={true}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  headerContainer: {
    backgroundColor: colors.backgroundLight,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarText: {
    ...typography.h1,
    color: colors.background,
    fontWeight: 'bold',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.background,
  },
  levelBadgeText: {
    ...typography.small,
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 10,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  profileEmail: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
    fontSize: 14,
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontWeight: 'bold',
    fontSize: 24,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  badgesContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  rarityContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  rarityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rarityCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.md,
  },
  rarityIconContainer: {
    marginBottom: spacing.xs,
  },
  commonCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.textMuted,
  },
  rareCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  epicCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  legendaryCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  rarityValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: 'bold',
    fontSize: 20,
  },
  rarityLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  settingsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  settingsList: {
    gap: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingText: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  xLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  xLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});


