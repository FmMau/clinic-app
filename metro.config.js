
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Soporte para .cjs (usado por algunos paquetes de Firebase)
defaultConfig.resolver.sourceExts.push('cjs');

// 🛠️ Desactiva export maps problemáticos
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
