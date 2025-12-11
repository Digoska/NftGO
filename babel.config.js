const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['transform-inline-environment-variables', {
        include: [
          'EXPO_PUBLIC_SUPABASE_URL',
          'EXPO_PUBLIC_SUPABASE_ANON_KEY',
          'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'
        ]
      }],
      // react-native-reanimated plugin - temporarily disabled for Expo Go compatibility
      // Uncomment when using development build or native build
      // 'react-native-reanimated/plugin',
    ],
  };
};

