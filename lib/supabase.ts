import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Get Supabase config from multiple sources with fallbacks
// Note: In release builds, process.env variables should be inlined by Babel
const supabaseUrl = (Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Debug logging for troubleshooting release builds
console.log('🔧 Supabase Config Debug:');
console.log('  URL Length:', supabaseUrl.length);
console.log('  URL Start:', supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : 'EMPTY');
console.log('  Key Length:', supabaseAnonKey.length);
console.log('  Constants.expoConfig.extra:', Constants.expoConfig?.extra ? 'Present' : 'Missing');

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

