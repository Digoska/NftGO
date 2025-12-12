const { withInfoPlist } = require('@expo/config-plugins');

/**
 * Config plugin to embed Supabase config into iOS Info.plist
 * This ensures environment variables are available in native builds
 */
const withSupabaseConfig = (config) => {
  return withInfoPlist(config, (config) => {
    // Add Supabase URL and key to Info.plist so they're available at runtime
    const supabaseUrl = config.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = config.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseAnonKey) {
      config.modResults.SupabaseURL = supabaseUrl;
      config.modResults.SupabaseAnonKey = supabaseAnonKey;
      console.log('✅ Added Supabase config to Info.plist');
    } else {
      console.warn('⚠️ Supabase config not found - will rely on Constants.expoConfig.extra');
    }

    return config;
  });
};

module.exports = withSupabaseConfig;


