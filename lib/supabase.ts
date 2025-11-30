import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Supabase Config:');
console.log('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING');
console.log('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ MISSING');
console.log('  From Constants:', Constants.expoConfig?.extra?.supabaseUrl ? 'Yes' : 'No');
console.log('  From ENV:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Yes' : 'No');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key is missing!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file');
  throw new Error('supabaseUrl is required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

