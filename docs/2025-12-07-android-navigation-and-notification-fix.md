# Fixes: Android Navigation Bar & Notifications (Dec 7, 2025)

## 1. Translucent Navigation Bar (Android)

### Problem
On Android, the system navigation bar (bottom buttons) was opaque, cutting off the app content or causing the bottom tab bar to look disconnected. We wanted a modern, edge-to-edge look where the app content flows behind the navigation bar.

### Solution
We implemented a translucent navigation bar using `expo-navigation-bar` and adjusted the bottom tab bar to respect safe area insets.

### Implementation Details

1.  **Package Installation:**
    -   Installed `expo-navigation-bar`.

2.  **Global Configuration (`app/_layout.tsx`):**
    -   Set the navigation bar position to `absolute` to allow content to flow behind it.
    -   Set the background color to transparent (`#ffffff00`).
    -   Set button style to `dark` for visibility on light backgrounds.

    ```typescript
    useEffect(() => {
      if (Platform.OS === 'android') {
        NavigationBar.setPositionAsync('absolute');
        NavigationBar.setBackgroundColorAsync('#ffffff00');
        NavigationBar.setButtonStyleAsync('dark');
      }
    }, []);
    ```

3.  **Tab Bar Adjustment (`app/(tabs)/_layout.tsx`):**
    -   Used `useSafeAreaInsets` to get the bottom inset (height of the navigation bar).
    -   Added this inset to the tab bar's `height` and `paddingBottom`.
    -   This ensures the interactive elements (icons, labels) are pushed up above the system buttons, while the tab bar background extends to the bottom edge.

    ```typescript
    const insets = useSafeAreaInsets();
    // ...
    tabBarStyle: {
      height: 60 + insets.bottom,
      paddingBottom: 8 + insets.bottom,
      // ...
    }
    ```

4.  **App Config (`app.config.js`):**
    -   Added the `expo-navigation-bar` plugin configuration for consistency in production builds.

## 2. Notification Error Suppression (Expo Go)

### Problem
The app was throwing a "functionality removed from Expo Go" error when attempting to register for push notifications. This is because Expo Go no longer supports the legacy push notification service directly in the client.

### Solution
We added a check to skip the push token registration process specifically when running in the Expo Go environment.

### Implementation Details

-   **File:** `lib/notifications.ts`
-   **Change:** Added a guard clause at the beginning of `getExpoPushToken`.

    ```typescript
    import Constants from 'expo-constants';

    export async function getExpoPushToken(): Promise<string | null> {
      try {
        // Skip registration in Expo Go
        if (Constants.appOwnership === 'expo') {
          console.log('Skipping push token registration in Expo Go');
          return null;
        }
        // ... continue with registration
      }
      // ...
    }
    ```

## Verification

-   **Android Navigation:** Tab bar should look seamless with the system navigation buttons floating over the extended background. Tabs should be clickable.
-   **Notifications:** No error should appear on app launch in Expo Go regarding `expo-notifications`.

