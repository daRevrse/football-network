const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom configurations
config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@services': './src/services',
  '@utils': './src/utils',
  '@assets': './src/assets',
  '@store': './src/store',
  '@navigation': './src/navigation',
};

module.exports = config;
