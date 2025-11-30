module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated plugin - temporarily disabled for Expo Go compatibility
      // Uncomment when using development build or native build
      // 'react-native-reanimated/plugin',
    ],
  };
};

