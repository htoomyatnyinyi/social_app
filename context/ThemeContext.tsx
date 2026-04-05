import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useColorScheme as useNativeColorScheme, vars } from "nativewind";
import { useColorScheme as useSystemColorScheme, View } from "react-native";

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  isDark: boolean;
  fontSizeScale: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor, fontSize } = useSelector((state: RootState) => state.settings);
  const { setColorScheme } = useNativeColorScheme();
  const systemColorScheme = useSystemColorScheme();

  const isDark = useMemo(() => {
    if (theme === "system") return systemColorScheme === "dark";
    return theme === "dark";
  }, [theme, systemColorScheme]);

  useEffect(() => {
    setColorScheme(isDark ? "dark" : "light");
  }, [isDark, setColorScheme]);

  const fontSizeScale = useMemo(() => {
    switch (fontSize) {
      case "small": return 0.9;
      case "large": return 1.1;
      default: return 1.0;
    }
  }, [fontSize]);

  const themeVars = useMemo(() => vars({
    "--accent-color": accentColor,
    "--font-scale": fontSizeScale.toString(),
  }), [accentColor, fontSizeScale]);

  const value = useMemo(() => ({
    theme,
    accentColor,
    fontSize,
    isDark,
    fontSizeScale,
  }), [theme, accentColor, fontSize, isDark, fontSizeScale]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars]}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
