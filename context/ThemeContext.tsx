import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useColorScheme as useNativeColorScheme } from "nativewind";
import { useColorScheme as useSystemColorScheme } from "react-native";

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

  const value = useMemo(() => ({
    theme,
    accentColor,
    fontSize,
    isDark,
    fontSizeScale,
  }), [theme, accentColor, fontSize, isDark, fontSizeScale]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
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
