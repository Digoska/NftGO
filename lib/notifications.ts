/**
 * Notification Service
 * Handles push notifications, permissions, and notification preferences
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREFERENCES_KEY = '@nftgo:notification_preferences';
const EXPO_PUSH_TOKEN_KEY = '@nftgo:expo_push_token';

export interface NotificationPreferences {
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

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Notifications only work on physical devices');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get Expo Push Token
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Check if we already have a token
    const cachedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    if (cachedToken) {
      return cachedToken;
    }

    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get project ID from Constants or use default
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.expoConfig?.extra?.projectId ||
                      undefined;
    
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const token = tokenData.data;
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
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
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_PREFERENCES_KEY,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    throw error;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  try {
    const preferences = await getNotificationPreferences();
    if (!preferences.enabled) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: trigger || null, // null = immediate
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Send notification for NFT collected
 */
export async function notifyNFTCollected(nftName: string, rarity: string): Promise<void> {
  const preferences = await getNotificationPreferences();
  if (!preferences.nftCollected) return;

  await scheduleNotification(
    '🎉 NFT Collected!',
    `You collected ${nftName} (${rarity})`,
    { type: 'nft_collected', nftName, rarity }
  );
}

/**
 * Send notification for level up
 */
export async function notifyLevelUp(newLevel: number): Promise<void> {
  const preferences = await getNotificationPreferences();
  if (!preferences.levelUp) return;

  await scheduleNotification(
    '⭐ Level Up!',
    `Congratulations! You reached level ${newLevel}`,
    { type: 'level_up', level: newLevel }
  );
}

/**
 * Send notification for streak reminder
 */
export async function scheduleStreakReminder(): Promise<void> {
  const preferences = await getNotificationPreferences();
  if (!preferences.streakReminder) return;

  // Schedule for tomorrow at 9 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  await scheduleNotification(
    '🔥 Keep Your Streak!',
    "Don't forget to collect NFTs today to maintain your streak!",
    { type: 'streak_reminder' },
    { date: tomorrow }
  );
}

/**
 * Send notification for new app update
 */
export async function notifyNewUpdate(title: string): Promise<void> {
  const preferences = await getNotificationPreferences();
  if (!preferences.newUpdates) return;

  await scheduleNotification(
    '📢 New Update',
    title,
    { type: 'app_update', title }
  );
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is foregrounded
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification tapped:', response);
      onNotificationTapped?.(response);
    }
  );

  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

