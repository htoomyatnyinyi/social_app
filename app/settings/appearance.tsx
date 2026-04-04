import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppearanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  
  // Local state for demonstration (in a real app this would be in Redux or MMKV)
  const [theme, setTheme] = useState("system"); // system, light, dark
  const [accentColor, setAccentColor] = useState("#0EA5E9"); // Sky-500

  const handleThemeChange = (newTheme: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(newTheme);
  };

  const handleAccentChange = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAccentColor(color);
  };

  const themes = [
    { id: "light", label: "Light", icon: "sunny-outline" },
    { id: "dark", label: "Dark", icon: "moon-outline" },
    { id: "system", label: "System", icon: "settings-outline" },
  ];

  const accents = [
    { id: "sky", color: "#0EA5E9" },
    { id: "rose", color: "#F43F5E" },
    { id: "emerald", color: "#10B981" },
    { id: "violet", color: "#8B5CF6" },
    { id: "amber", color: "#F59E0B" },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <BlurView
        intensity={90}
        tint="light"
        className="px-5 pb-5 z-50 border-b border-gray-100/50"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100 mr-4"
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-black text-gray-900 tracking-[-1px] uppercase">Appearance</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Theme & Visuals</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Theme Section */}
        <View className="mt-8 px-5">
          <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Mode</Text>
          <View className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm shadow-gray-100 overflow-hidden">
            {themes.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleThemeChange(item.id)}
                className={`flex-row items-center px-6 py-5 ${i !== themes.length - 1 ? "border-b border-gray-100/30" : ""}`}
              >
                <View className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center mr-4">
                  <Ionicons name={item.icon as any} size={20} color={theme === item.id ? accentColor : "#64748B"} />
                </View>
                <Text className={`flex-1 text-[15px] font-black tracking-tight ${theme === item.id ? "text-gray-900" : "text-gray-400"}`}>
                  {item.label}
                  {item.id === "system" && ` (${systemColorScheme})`}
                </Text>
                {theme === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color={accentColor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accent Section */}
        <View className="mt-8 px-5">
          <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Accent Color</Text>
          <View className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm shadow-gray-100 p-6">
            <View className="flex-row justify-between">
              {accents.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleAccentChange(item.color)}
                  style={{
                    backgroundColor: item.color,
                    width: 44,
                    height: 44,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: accentColor === item.color ? 3 : 0,
                    borderColor: "white",
                  }}
                  className="shadow-sm shadow-gray-400"
                >
                  {accentColor === item.color && (
                    <Ionicons name="checkmark" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View className="mt-10 px-8 opacity-40">
          <Text className="text-center text-[11px] font-medium text-gray-500 leading-[18px]">
            Dark mode and color accents help you personalize your experience. Selecting "System" will automatically sync with your device's global display settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
