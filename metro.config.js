/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

module.exports = withNativeWind(config, { input: './global.css' });
/* eslint-enable @typescript-eslint/no-require-imports */
