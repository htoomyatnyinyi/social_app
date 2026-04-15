
// import { Stack } from "expo-router";
// import { useTheme } from "../../context/ThemeContext";

// export default function SettingsLayout() {
//   const { isDark } = useTheme();

//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false,
//         contentStyle: { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" },
//       }}
//     />
//   );
// }


import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsLayout() {
  const theme = useTheme();

  // If theme is totally missing (context failure), 
  // we fallback to a safe string to prevent the Style error.
  const bgColor = theme?.isDark ? "#0F172A" : "#F8FAFC";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: bgColor },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="meditation" />
    </Stack>
  );
}