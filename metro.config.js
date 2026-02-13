const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// config.resolver.sourceExts.push("sql", "wasm"); // Add this line
config.resolver.sourceExts.push("sql"); // Add this line

module.exports = withNativeWind(config, { input: "./global.css" });
