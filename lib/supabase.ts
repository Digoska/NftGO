import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Get Supabase config from multiple sources with fallbacks
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug logging for troubleshooting release builds
console.log('🔧 Supabase Config Debug:');
console.log('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING');
console.log('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ MISSING');
console.log('  Constants.expoConfig:', Constants.expoConfig ? 'exists' : 'null');
console.log('  Constants.expoConfig.extra:', Constants.expoConfig?.extra ? JSON.stringify(Object.keys(Constants.expoConfig.extra)) : 'null');
console.log('  From Constants:', Constants.expoConfig?.extra?.supabaseUrl ? 'Yes' : 'No');
console.log('  From ENV:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Yes' : 'No');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key is missing!');
  console.error('Constants.expoConfig:', JSON.stringify(Constants.expoConfig, null, 2));
  throw new Error('supabaseUrl is required. Check that .env file is properly loaded during build.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

