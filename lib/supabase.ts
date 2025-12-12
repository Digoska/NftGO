import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Try multiple sources for Supabase config (order matters for native builds)
// Note: In release builds, process.env variables should be inlined by Babel
const getSupabaseUrl = () => {
  // 1. Try from Constants.expoConfig.extra (most reliable - works in all builds)
  if (Constants.expoConfig?.extra?.supabaseUrl) {
    return Constants.expoConfig.extra.supabaseUrl.trim();
  }
  
  // 2. Try from Info.plist (native builds) - Constants.expoConfig.ios.infoPlist contains Info.plist values
  if (Platform.OS === 'ios' && Constants.expoConfig?.ios?.infoPlist) {
    const fromPlist = Constants.expoConfig.ios.infoPlist.SupabaseURL;
    if (fromPlist) {
      return fromPlist.trim();
    }
  }
  
  // 3. Try from process.env (development/Metro)
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    return process.env.EXPO_PUBLIC_SUPABASE_URL.trim();
  }
  
  return '';
};

const getSupabaseAnonKey = () => {
  // 1. Try from Constants.expoConfig.extra (most reliable - works in all builds)
  if (Constants.expoConfig?.extra?.supabaseAnonKey) {
    return Constants.expoConfig.extra.supabaseAnonKey.trim();
  }
  
  // 2. Try from Info.plist (native builds)
  if (Platform.OS === 'ios' && Constants.expoConfig?.ios?.infoPlist) {
    const fromPlist = Constants.expoConfig.ios.infoPlist.SupabaseAnonKey;
    if (fromPlist) {
      return fromPlist.trim();
    }
  }
  
  // 3. Try from process.env (development/Metro)
  if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.trim();
  }
  
  return '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
  console.error('❌ Supabase Configuration Error!');
  console.error('  URL:', supabaseUrl);
  console.error('  Key set:', !!supabaseAnonKey);
  console.error('  Environment:', process.env.NODE_ENV);
  console.error('  Tip: Check .env file or EAS Secrets. For release builds, variables must be set at build time.');
  
  // Throw a more descriptive error to prevent "JSON Parse error" downstream
  throw new Error(
    `Supabase configuration missing or invalid. URL: ${supabaseUrl || 'missing'}. ` +
    'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Create Supabase client with custom fetch to handle React Native network issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Use React Native's fetch which handles network better
    fetch: fetch,
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

