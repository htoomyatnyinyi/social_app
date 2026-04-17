import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  const [toggles, setToggles] = useState({
    faceId: true,
    twoFactor: false,
    loginAlerts: true,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* Premium Header */}
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        className={`px-5 pb-5 z-50 border-b ${isDark ? "border-slate-800/50" : "border-gray-100/50"}`}
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
                ? "bg-slate-800 border-slate-700 shadow-black"
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
              Security
            </Text>
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              App Protection & Access
            </Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Shield Icon Header */}
        <View className="mt-8 items-center mb-8">
          <View
            className={`w-24 h-24 rounded-full items-center justify-center border-4 ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-emerald-50 border-emerald-100"}`}
          >
            <Ionicons
              name="shield-checkmark"
              size={48}
              color={isDark ? "#10B981" : "#059669"}
            />
          </View>
          <Text
            className={`mt-5 text-xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Account Protected
          </Text>
          <Text
            className={`text-center text-[13px] font-medium leading-[20px] mt-2 px-6 ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            Your account is secured with end-to-end platform encryption.
          </Text>
        </View>

        {/* Protection Core */}
        <Text
          className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
        >
          Access Controls
        </Text>
        <View
          className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
        >
          <TouchableOpacity
            onPress={() => router.push("/settings/change-password")}
            className={`flex-row items-center px-6 py-5 border-b ${isDark ? "border-slate-800/50" : "border-gray-50"}`}
          >
            <View
              className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}
            >
              <Ionicons
                name="key"
                size={20}
                color={isDark ? accentColor : "#64748B"}
              />
            </View>
            <View className="flex-1">
              <Text
                className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Password
              </Text>
              <Text
                className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
              >
                Last changed 3 months ago
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#334155" : "#CBD5E1"}
            />
          </TouchableOpacity>

          <ToggleItem
            icon="scan"
            title="App Lock (Biometrics)"
            desc="Require FaceID to open app"
            value={toggles.faceId}
            onToggle={() => handleToggle("faceId")}
            isDark={isDark}
            accentColor={accentColor}
          />

          <ToggleItem
            icon="phone-portrait"
            title="Two-Factor (2FA)"
            desc="Additional security step via SMS"
            value={toggles.twoFactor}
            onToggle={() => handleToggle("twoFactor")}
            isDark={isDark}
            accentColor={accentColor}
          />
        </View>

        {/* Session Management */}
        <View className="mt-8">
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Session Management
          </Text>
          <View
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
          >
            <ToggleItem
              icon="notifications"
              title="Login Alerts"
              desc="Get notified of unrecognized logins"
              value={toggles.loginAlerts}
              onToggle={() => handleToggle("loginAlerts")}
              isDark={isDark}
              accentColor={accentColor}
            />

            <TouchableOpacity
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              className={`flex-row items-center px-6 py-5 border-t ${isDark ? "border-slate-800/50" : "border-gray-50"}`}
            >
              <View
                className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}
              >
                <Ionicons
                  name="desktop"
                  size={20}
                  color={isDark ? "#818CF8" : "#6366F1"}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Active Sessions
                </Text>
                <Text
                  className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
                >
                  2 devices logged in
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? "#334155" : "#CBD5E1"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/settings/delete-account");
          }}
          className={`mt-12 p-6 rounded-[32px] items-center flex-row justify-between border ${isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100 shadow-sm shadow-rose-100"}`}
        >
          <View>
            <Text className="text-rose-500 font-black text-lg uppercase tracking-tight">
              Delete Account
            </Text>
            <Text
              className={`text-xs font-medium uppercase tracking-widest mt-1 ${isDark ? "text-rose-300/50" : "text-rose-400"}`}
            >
              Deactivate & Erase Data
            </Text>
          </View>
          <View
            className={`p-3 rounded-2xl ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <Ionicons name="trash" size={24} color="#F43F5E" />
          </View>
        </TouchableOpacity>

        <View className="mt-12 opacity-30 items-center">
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            HTOO MYAT NYI NYI
          </Text>
          <Text
            className={`text-[9px] mt-2 font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            V 2.4.1009-ALPHA • SECURITY MODULE
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const ToggleItem = ({
  icon,
  title,
  desc,
  value,
  onToggle,
  isDark,
  accentColor,
}: any) => (
  <View className={`flex-row items-center px-6 py-5`}>
    <View
      className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isDark ? accentColor : "#64748B"}
      />
    </View>
    <View className="flex-1 mr-4">
      <Text
        className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {title}
      </Text>
      <Text
        className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
      >
        {desc}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{
        false: isDark ? "#334155" : "#E2E8F0",
        true: isDark ? accentColor : "#10B981",
      }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={isDark ? "#334155" : "#E2E8F0"}
    />
  </View>
);
