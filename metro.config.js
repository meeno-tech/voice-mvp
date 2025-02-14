const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { withSentryConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

/** @type {import('expo/metro-config').MetroConfig} */
const sentryConfig = withSentryConfig(defaultConfig);

/** @type {import('expo/metro-config').MetroConfig} */
const nativeWindConfig = withNativeWind(sentryConfig, { input: './global.css' });

module.exports = nativeWindConfig;
