import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { useEffect } from 'react';
import { Platform } from 'react-native';
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
          console.log('✅ Blob polyfill loaded from expo-blob (on mount)');
        }
      } catch (error) {
        console.warn('⚠️ Could not load Blob polyfill:', error);
      }
    }
  }, []);

  // Initialize notifications
  useEffect(() => {
    // Request permissions on app start
    requestNotificationPermissions().then((granted) => {
      if (granted) {
        console.log('✅ Notification permissions granted');
      } else {
        console.log('⚠️ Notification permissions not granted');
      }
    });

    // Setup notification listeners
    const unsubscribe = setupNotificationListeners(
      (notification) => {
        console.log('📱 Notification received:', notification);
      },
      (response) => {
        console.log('👆 Notification tapped:', response);
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

