/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#2C3E50",
    background: "#F5F6FA",
    tint: "#D4AF37", // Gold
    icon: "#7F8C8D",
    tabIconDefault: "#95a5a6",
    tabIconSelected: "#D4AF37",
    primary: "#2C3E50", // Deep Blue
    secondary: "#D4AF37", // Gold
    accent: "#E74C3C", // Soft Red for stop/alert
    surface: "#FFFFFF",
  },
  dark: {
    text: "#ECF0F1",
    background: "#1A1A2E", // Deep Night Blue
    tint: "#F1C40F", // Bright Gold
    icon: "#BDC3C7",
    tabIconDefault: "#7F8C8D",
    tabIconSelected: "#F1C40F",
    primary: "#ECF0F1",
    secondary: "#F1C40F",
    accent: "#E74C3C",
    surface: "#16213E",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
