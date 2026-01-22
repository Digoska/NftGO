import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { requestNotificationPermissions, setupNotificationListeners } from '../lib/notifications';

// Setup Blob polyfill from expo-blob
// This must be done BEFORE any modules that use Blob API (like GLTFLoader)
// IMPORTANT: expo-blob requires native modules and does NOT work in Expo Go
// It only works in development builds or production builds
// For Expo Go, we need to use a different solution (GLTF with external textures)

// DISABLED POLYFILL - Suspected cause of "JSON Parse error: Unexpected character: o" in release builds
// It seems expo-blob interferes with fetch response handling, causing response.text() to return "[object Object]"
/*
try {
  // Try to import expo-blob
  const expoBlob = require('expo-blob');
  console.log('🔍 expo-blob module loaded:', typeof expoBlob);
  console.log('🔍 expo-blob keys:', Object.keys(expoBlob || {}));
  
  // Try different ways to get Blob
  const BlobPolyfill = expoBlob.Blob || expoBlob.default?.Blob || expoBlob.default || expoBlob;
  console.log('🔍 BlobPolyfill type:', typeof BlobPolyfill);
  
  if (BlobPolyfill && typeof BlobPolyfill === 'function') {
    // Always register expo-blob Blob as global (overwrite any existing Blob)
    global.Blob = BlobPolyfill;
    globalThis.Blob = BlobPolyfill;
    console.log('✅ Blob polyfill loaded from expo-blob');
    
    // Test if Blob supports ArrayBuffer
    try {
      const testBlob = new BlobPolyfill([new Uint8Array([1, 2, 3])]);
      console.log('✅ Blob supports ArrayBuffer/Uint8Array, test blob size:', testBlob.size);
    } catch (testError: any) {
      console.warn('⚠️ Blob may not support ArrayBuffer:', testError?.message || testError);
    }
  } else {
    console.warn('⚠️ expo-blob Blob not found or not a function');
    console.warn('⚠️ BlobPolyfill:', BlobPolyfill);
  }
} catch (error: any) {
  // expo-blob requires native modules - it doesn't work in Expo Go
  console.warn('⚠️ Could not load expo-blob:', error?.message || error);
  console.warn('⚠️ expo-blob requires native modules and does NOT work in Expo Go');
  console.warn('⚠️ You need to use development build (expo prebuild + rebuild)');
  console.warn('⚠️ OR use GLTF format with external textures (works in Expo Go)');
  
  if (typeof global.Blob === 'undefined') {
    console.error('❌ No Blob API available - GLB embedded textures will not work');
    console.error('❌ Solution: Use GLTF format with external textures instead');
  } else {
    console.warn('⚠️ Using existing Blob (does not support ArrayBuffer in Expo Go)');
    console.warn('⚠️ GLB embedded textures will NOT work - use GLTF with external textures');
  }
}
*/

export default function RootLayout() {
  // Configure Android Navigation Bar to be transparent
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Set navigation bar to be transparent and content to flow behind it
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setBackgroundColorAsync('#ffffff00'); // Transparent
      NavigationBar.setButtonStyleAsync('dark'); // Dark icons (black buttons)
    }
  }, []);

  // Ensure Blob is available on mount
  useEffect(() => {
    if (typeof global.Blob === 'undefined') {
      try {
        const { Blob } = require('expo-blob');
        if (Blob) {
          global.Blob = Blob;
          globalThis.Blob = Blob;
        }
      } catch (error) {
        // Blob polyfill not available (expected in Expo Go)
      }
    }
  }, []);

  // Initialize notifications
  useEffect(() => {
    // Request permissions on app start
    requestNotificationPermissions();

    // Setup notification listeners
    const unsubscribe = setupNotificationListeners(
      () => {
        // Notification received
      },
      (response) => {
        // Handle notification tap - navigate to relevant screen
        const data = response.notification.request.content.data;
        if (data?.type === 'nft_collected') {
          // Navigate to wallet/collection
        } else if (data?.type === 'level_up') {
          // Navigate to profile
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle deep links for password reset
  useEffect(() => {
    // Robust function to parse tokens from both hash (#) and query params (?)
    const handleUrl = (url: string | null) => {
      if (!url) return;

      console.log('🔗 Processing deep link URL:', url);

      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let type: string | null = null;

      try {
        // Try to parse from hash fragment first (e.g., nftgo://reset-password#access_token=...)
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const hash = url.substring(hashIndex + 1);
          const hashParams = new URLSearchParams(hash);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
        }

        // If not found in hash, try query params (e.g., nftgo://reset-password?access_token=...)
        if (!accessToken) {
          const queryIndex = url.indexOf('?');
          if (queryIndex !== -1) {
            const query = url.substring(queryIndex + 1);
            // Remove hash if present in query string
            const queryWithoutHash = query.split('#')[0];
            const queryParams = new URLSearchParams(queryWithoutHash);
            accessToken = queryParams.get('access_token') || accessToken;
            refreshToken = queryParams.get('refresh_token') || refreshToken;
            type = queryParams.get('type') || type;
          }
        }

        // Also try parsing as a full URL
        if (!accessToken) {
          try {
            const urlObj = new URL(url);
            // Check hash fragment
            if (urlObj.hash) {
              const hashParams = new URLSearchParams(urlObj.hash.substring(1));
              accessToken = hashParams.get('access_token') || accessToken;
              refreshToken = hashParams.get('refresh_token') || refreshToken;
              type = hashParams.get('type') || type;
            }
            // Check query params
            if (!accessToken) {
              accessToken = urlObj.searchParams.get('access_token') || accessToken;
              refreshToken = urlObj.searchParams.get('refresh_token') || refreshToken;
              type = urlObj.searchParams.get('type') || type;
            }
          } catch (e) {
            // URL parsing failed, continue with previous values
            console.log('⚠️ Could not parse as URL object, using manual parsing');
          }
        }

        // If we found tokens and it's a recovery type, navigate to reset-password
        if (accessToken && type === 'recovery') {
          console.log('✅ Password reset tokens found, navigating to reset-password');
          router.push({
            pathname: '/(auth)/reset-password',
            params: {
              access_token: accessToken,
              refresh_token: refreshToken || '',
              type: type,
            },
          });
        }
      } catch (error) {
        console.error('❌ Error parsing deep link URL:', error);
      }
    };

    // Check initial URL when app opens
    Linking.getInitialURL().then((url) => {
      handleUrl(url);
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}

