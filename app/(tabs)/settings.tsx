import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Button from '../../components/common/Button';

// Local definition to avoid importing lib/notifications.ts which causes side effects in Expo Go
const NOTIFICATION_PREFERENCES_KEY = '@nftgo:notification_preferences';

interface NotificationPreferences {
  enabled: boolean;
  nftCollected: boolean;
  levelUp: boolean;
  streakReminder: boolean;
  newUpdates: boolean;
  leaderboardChanges: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  nftCollected: true,
  levelUp: true,
  streakReminder: true,
  newUpdates: true,
  leaderboardChanges: false,
};

// Local implementation of getNotificationPreferences
const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

// Local implementation of saveNotificationPreferences
const saveNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_PREFERENCES_KEY,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    throw error;
  }
};

export default function SettingsScreen() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    // If enabling notifications, request permissions first
    if (key === 'enabled' && value) {
      let hasPermission = false;
      
      // Check if we are in Expo Go
      if (Constants.appOwnership === 'expo') {
        console.log('Skipping notification permission request in Expo Go');
        hasPermission = true; // Assume true to allow toggling in dev
      } else {
        try {
          // Dynamically import to avoid top-level side effects
          const { requestNotificationPermissions } = require('../../lib/notifications');
          hasPermission = await requestNotificationPermissions();
        } catch (error) {
          console.error('Error requesting permissions:', error);
          hasPermission = false;
        }
      }

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive notifications.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // If disabling main notifications, disable all
    if (key === 'enabled' && !value) {
      const allDisabled = {
        ...newPreferences,
        nftCollected: false,
        levelUp: false,
        streakReminder: false,
        newUpdates: false,
        leaderboardChanges: false,
      };
      setPreferences(allDisabled);
      await saveNotificationPreferences(allDisabled);
    } else {
      await saveNotificationPreferences(newPreferences);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNotificationPreferences(preferences);
      Alert.alert('Success', 'Settings saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Manage your notification preferences
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Enable Notifications</Text>
                <Text style={styles.settingSubtext}>
                  Turn on/off all notifications
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => handleToggle('enabled', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          {preferences.enabled && (
            <>
              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="trophy-outline" size={20} color={colors.text} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingText}>NFT Collected</Text>
                    <Text style={styles.settingSubtext}>
                      Get notified when you collect an NFT
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.nftCollected}
                  onValueChange={(value) => handleToggle('nftCollected', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="star-outline" size={20} color={colors.text} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingText}>Level Up</Text>
                    <Text style={styles.settingSubtext}>
                      Get notified when you level up
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.levelUp}
                  onValueChange={(value) => handleToggle('levelUp', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="flame-outline" size={20} color={colors.text} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingText}>Streak Reminder</Text>
                    <Text style={styles.settingSubtext}>
                      Daily reminder to maintain your streak
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.streakReminder}
                  onValueChange={(value) => handleToggle('streakReminder', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="megaphone-outline" size={20} color={colors.text} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingText}>App Updates</Text>
                    <Text style={styles.settingSubtext}>
                      Get notified about new announcements
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.newUpdates}
                  onValueChange={(value) => handleToggle('newUpdates', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="podium-outline" size={20} color={colors.text} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingText}>Leaderboard Changes</Text>
                    <Text style={styles.settingSubtext}>
                      Get notified when your rank changes
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.leaderboardChanges}
                  onValueChange={(value) => handleToggle('leaderboardChanges', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
            </>
          )}
        </View>

        {/* Location Testing Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bug-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Testing & Debug</Text>
          </View>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(tabs)/location-test')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="location-outline" size={20} color={colors.text} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Test GPS Location</Text>
                <Text style={styles.settingSubtext}>
                  Test location functionality and simulate GPS coordinates
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.saveButtonContainer}>
          <Button
            title="Save Settings"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  settingTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  settingSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  saveButtonContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});