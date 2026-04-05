import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import {
  setTheme,
  setAccentColor,
  setFontSize,
} from "../../store/settingsSlice";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const dispatch = useDispatch();

  const { theme, accentColor, fontSize } = useSelector(
    (state: RootState) => state.settings,
  );

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setTheme(newTheme));
  };

  const handleAccentChange = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(setAccentColor(color));
  };

  const handleFontSizeChange = (size: "small" | "medium" | "large") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setFontSize(size));
  };

  const themes = [
    {
      id: "light",
      label: "Light",
      icon: "sunny-outline",
      description: "Classic bright look",
    },
    {
      id: "dark",
      label: "Dark",
      icon: "moon-outline",
      description: "Easy on the eyes",
    },
    {
      id: "system",
      label: "System",
      icon: "settings-outline",
      description: "Follows device settings",
    },
  ];

  const accents = [
    { id: "sky", color: "#0EA5E9", name: "Sky" },
    { id: "rose", color: "#F43F5E", name: "Rose" },
    { id: "emerald", color: "#10B981", name: "Emerald" },
    { id: "violet", color: "#8B5CF6", name: "Violet" },
    { id: "amber", color: "#F59E0B", name: "Amber" },
    { id: "slate", color: "#475569", name: "Slate" },
  ];

  const fontSizes = [
    { id: "small", label: "Compact", scale: 0.9 },
    { id: "medium", label: "Default", scale: 1.0 },
    { id: "large", label: "Comfortable", scale: 1.1 },
  ];

  const isDark =
    theme === "dark" || (theme === "system" && systemColorScheme === "dark");

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* Header */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        className="px-5 pb-5 z-50 border-b border-gray-200/10"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className={`w-10 h-10 rounded-2xl items-center justify-center border shadow-sm ${
              isDark
                ? "bg-slate-800 border-slate-700 shadow-slate-900"
                : "bg-white border-gray-50 shadow-gray-100"
            } mr-4`}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </TouchableOpacity>
          <View>
            <Text
              className={`text-2xl font-black tracking-[-1px] uppercase ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Appearance
            </Text>
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              Personalize your experience
            </Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Preview Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          className="mt-8 px-5"
        >
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Live Preview
          </Text>
          <View
            className={`p-6 rounded-[32px] border ${
              isDark
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-gray-100 shadow-sm shadow-gray-200"
            }`}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-10 h-10 rounded-full bg-gray-200"
                style={{ backgroundColor: accentColor + "20" }}
              >
                <View className="flex-1 items-center justify-center">
                  <Ionicons name="person" size={20} color={accentColor} />
                </View>
              </View>
              <View className="ml-3">
                <Text
                  className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  style={{
                    fontSize:
                      fontSize === "small"
                        ? 14
                        : fontSize === "large"
                          ? 18
                          : 16,
                  }}
                >
                  John Doe
                </Text>
                <Text
                  className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}
                >
                  @johndoe • Now
                </Text>
              </View>
            </View>
            <Text
              className={`${isDark ? "text-slate-300" : "text-gray-600"} mb-4`}
              style={{
                fontSize:
                  fontSize === "small" ? 13 : fontSize === "large" ? 17 : 15,
              }}
            >
              This is how your posts and interface will look with current
              settings.
            </Text>
            <TouchableOpacity
              disabled
              style={{ backgroundColor: accentColor }}
              className="py-3 px-6 rounded-2xl items-center"
            >
              <Text className="text-white font-bold">Action Button</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Theme Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="mt-8 px-5"
        >
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Visual Mode
          </Text>
          <View className="flex-row justify-between">
            {themes.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleThemeChange(item.id as any)}
                style={{ width: (width - 60) / 3 }}
                className={`p-4 rounded-[24px] items-center border ${
                  theme === item.id
                    ? `bg-white ${isDark ? "border-white/20" : "border-gray-200"} shadow-md shadow-black/5`
                    : `${isDark ? "bg-slate-800/40 border-transparent" : "bg-gray-100/50 border-transparent"}`
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${
                    theme === item.id ? "" : ""
                  }`}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={
                      theme === item.id
                        ? accentColor
                        : isDark
                          ? "#64748B"
                          : "#94A3B8"
                    }
                  />
                </View>
                <Text
                  className={`text-[12px] font-black tracking-tight ${
                    theme === item.id
                      ? isDark
                        ? "text-slate-900"
                        : "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Accent Color Section */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="mt-8 px-5"
        >
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Accent Color
          </Text>
          <View
            className={`p-5 rounded-[32px] border ${
              isDark
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-gray-100 shadow-sm shadow-gray-100"
            }`}
          >
            <View className="flex-row flex-wrap justify-between">
              {accents.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleAccentChange(item.color)}
                  style={{
                    backgroundColor: item.color,
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    borderWidth: accentColor === item.color ? 4 : 0,
                    borderColor: isDark ? "#1E293B" : "white",
                  }}
                  className="shadow-sm"
                >
                  {accentColor === item.color && (
                    <Ionicons name="checkmark" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Font Size Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="mt-8 px-5"
        >
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Text Scaling
          </Text>
          <View
            className={`rounded-[32px] border overflow-hidden ${
              isDark
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-gray-100 shadow-sm shadow-gray-100"
            }`}
          >
            {fontSizes.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleFontSizeChange(item.id as any)}
                className={`flex-row items-center px-6 py-5 ${
                  i !== fontSizes.length - 1
                    ? isDark
                      ? "border-b border-slate-700/50"
                      : "border-b border-gray-100/50"
                    : ""
                }`}
              >
                <View
                  className={`w-8 h-8 rounded-lg items-center justify-center mr-4 ${
                    isDark ? "bg-slate-700/50" : "bg-gray-50"
                  }`}
                >
                  <Text
                    className={`font-black ${isDark ? "text-white" : "text-gray-900"}`}
                    style={{ fontSize: 10 * item.scale }}
                  >
                    Aa
                  </Text>
                </View>
                <Text
                  className={`flex-1 text-[15px] font-bold ${
                    fontSize === item.id
                      ? isDark
                        ? "text-white"
                        : "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {item.label}
                </Text>
                {fontSize === item.id && (
                  <Ionicons
                    name="radio-button-on"
                    size={22}
                    color={accentColor}
                  />
                )}
                {fontSize !== item.id && (
                  <Ionicons
                    name="radio-button-off"
                    size={22}
                    color={isDark ? "#334155" : "#E2E8F0"}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Info Box */}
        <View className="mt-10 px-8 opacity-40">
          <Text
            className={`text-center text-[11px] font-medium leading-[18px] ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            System settings will automatically sync with your devics global
            display preferences including Night Shift and scheduled dark mode.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
