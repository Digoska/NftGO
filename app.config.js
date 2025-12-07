require('dotenv').config();

module.exports = {
  expo: {
    name: 'NftGO',
    slug: 'nft-go',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/NftGO-2.png',
    userInterfaceStyle: 'light',
    scheme: 'nftgo',
    splash: {
      image: './assets/NftGO-2.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.nftgo.app',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'NftGO needs access to your location to collect NFTs nearby.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'NftGO needs access to your location to collect NFTs nearby.',
        NSLocationAlwaysUsageDescription: 'NftGO needs access to your location to collect NFTs nearby.',
      },
      // iOS uses Apple Maps (FREE, no API key needed)
      // Google Maps API key is only for Android
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/NftGO-2.png',
        backgroundColor: '#FFFFFF',
      },
      package: 'com.nftgo.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'NftGO needs access to your location to collect NFTs nearby.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/NftGO-2.png',
          color: '#7C3AED',
          sounds: [],
        },
      ],
      'expo-apple-authentication',
      'expo-file-system',
      [
        'expo-navigation-bar',
        {
          position: 'absolute',
          backgroundColor: '#ffffff00',
          buttonStyle: 'dark',
        },
      ],
    ],
  },
};

