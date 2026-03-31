const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add 'sql' and 'wasm' to source extensions
config.resolver.sourceExts.push("sql", "wasm");

// Also add 'wasm' to asset extensions to ensure it's bundled
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, { input: "./global.css" });

// original
// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require("nativewind/metro");


// const config = getDefaultConfig(__dirname);

// // config.resolver.sourceExts.push("sql", "wasm"); // Add this line
// config.resolver.sourceExts.push("sql"); // Add this line

// module.exports = withNativeWind(config, { input: "./global.css" });


