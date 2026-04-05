import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsLayout() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" },
      }}
    />
  );
}
