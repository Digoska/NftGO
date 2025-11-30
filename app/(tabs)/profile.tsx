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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
      </View>

      {/* Description */}
      {userProfile?.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{userProfile.description}</Text>
        </View>
      )}

      {/* Badges Section */}
      <View style={styles.badgesContainer}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <BadgeList badges={badges} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.total_nfts || 0}</Text>
          <Text style={styles.statLabel}>Total NFTs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Level {stats?.level || 1}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.experience || 0}</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
      </View>

      <View style={styles.rarityContainer}>
        <Text style={styles.sectionTitle}>Collection Breakdown</Text>
        <View style={styles.rarityGrid}>
          <View style={[styles.rarityCard, { backgroundColor: colors.textMuted }]}>
            <Text style={styles.rarityValue}>{stats?.common_count || 0}</Text>
            <Text style={styles.rarityLabel}>Common</Text>
          </View>
          <View style={[styles.rarityCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.rarityValue}>{stats?.rare_count || 0}</Text>
            <Text style={styles.rarityLabel}>Rare</Text>
          </View>
          <View style={[styles.rarityCard, { backgroundColor: colors.secondary }]}>
            <Text style={styles.rarityValue}>{stats?.epic_count || 0}</Text>
            <Text style={styles.rarityLabel}>Epic</Text>
          </View>
          <View style={[styles.rarityCard, { backgroundColor: colors.warning }]}>
            <Text style={styles.rarityValue}>{stats?.legendary_count || 0}</Text>
            <Text style={styles.rarityLabel}>Legendary</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/edit-profile')}
        >
          <Text style={styles.settingText}>Edit Profile</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Notifications</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(auth)/privacy-policy')}
        >
          <Text style={styles.settingText}>Privacy Policy</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(auth)/terms-of-service')}
        >
          <Text style={styles.settingText}>Terms of Service</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>About</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
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
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: colors.text,
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
    ...typography.body,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
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
  rarityContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  rarityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rarityCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rarityValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rarityLabel: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.9,
  },
  settingsContainer: {
    marginBottom: spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  settingText: {
    ...typography.body,
    color: colors.text,
  },
  settingArrow: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  logoutButton: {
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
  },
  descriptionContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  badgesContainer: {
    marginBottom: spacing.xl,
  },
});


