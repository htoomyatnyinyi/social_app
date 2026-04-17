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
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

const isFabricEnabled = Boolean((global as any)?.nativeFabricUIManager);
if (
  Platform.OS === "android" &&
  !isFabricEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PrivacyCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* Header */}
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
              Privacy Center
            </Text>
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              Security & Visibility
            </Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Intro */}
        <View className="mt-8 px-1 mb-8">
          <Text
            className={`text-2xl font-black leading-[32px] tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Your presence, your rules.
          </Text>
          <Text
            className={`text-[14px] font-medium leading-[22px] mt-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            Manage how you appear to others and how your data is handled across
            the network.
          </Text>
        </View>

        {/* Visibility Grid */}
        <Text
          className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
        >
          Quick Controls
        </Text>
        <View className="flex-row flex-wrap justify-between">
          <GridCard
            icon="eye-off"
            label="Invisibility"
            sub="Ghost Mode"
            color="#0EA5E9"
            isDark={isDark}
          />
          <GridCard
            icon="people"
            label="Audience"
            sub="Connections"
            color="#6366F1"
            isDark={isDark}
          />
          <GridCard
            icon="search"
            label="Searchable"
            sub="Discovery"
            color="#10B981"
            isDark={isDark}
          />
          <GridCard
            icon="stats-chart"
            label="Analytics"
            sub="Data Usage"
            color="#F59E0B"
            isDark={isDark}
          />
        </View>

        {/* Detailed Visibility Breakdown */}
        <View className="mt-8">
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Visibility Breakdown
          </Text>
          <View
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
          >
            <PolicyAccordion
              isDark={isDark}
              title="Invisibility (Ghost Mode)"
              icon="eye-off-outline"
              content="Enabling Ghost Mode hides your 'Online' status and last seen timestamp. Additionally, read receipts for messages and story views will remain anonymous until you choose to reveal them."
            />
            <PolicyAccordion
              isDark={isDark}
              title="Audience Control"
              icon="people-outline"
              content="Define who can see your full profile. 'Connections Only' ensures that only users you have mutually followed can view your media, posts, and personal bio details."
            />
            <PolicyAccordion
              isDark={isDark}
              title="Search Discovery"
              icon="search-outline"
              content="Control if your account appears in global search or 'Suggested Users.' When disabled, you can only be found if someone has your direct @handle or unique profile link."
            />
            <PolicyAccordion
              isDark={isDark}
              title="Analytics & Tracking"
              icon="stats-chart-outline"
              content="Choose whether to share anonymous app usage data to help us improve performance. We do not track your activity across other companies' apps and websites."
            />
          </View>
        </View>

        {/* Data & Legal */}
        <View className="mt-8">
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Data Policies
          </Text>
          <View
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
          >
            <PolicyAccordion
              isDark={isDark}
              title="Information Collection"
              icon="server-outline"
              content="We only store what's necessary: your email for login and encrypted metadata for app performance. We never sell your personal data to third-party ad networks."
            />
            <PolicyAccordion
              isDark={isDark}
              title="Retention Protocol"
              icon="time-outline"
              content="Active account data is kept as long as the account exists. Deleted data is purged from our primary servers within 30 days, aligned with 2026 compliance standards."
            />
          </View>
        </View>

        {/* Danger Zone */}
        {/* <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/settings/delete-account");
          }}
          className={`mt-12 p-6 rounded-[32px] items-center flex-row justify-between border ${isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100 shadow-sm shadow-rose-100"
            }`}
        >
          <View>
            <Text className="text-rose-500 font-black text-lg uppercase tracking-tight">Delete Account</Text>
            <Text className={`text-xs font-medium uppercase tracking-widest mt-1 ${isDark ? "text-rose-300/50" : "text-rose-400"}`}>Permanent Data Removal</Text>
          </View>
          <View className={`p-3 rounded-2xl ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <Ionicons name="trash" size={24} color="#F43F5E" />
          </View>
        </TouchableOpacity> */}

        <View className="mt-12 opacity-30 items-center">
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            HTOO MYAT NYI NYI
          </Text>
          <Text
            className={`text-[9px] mt-2 font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            V 2.4.1009-ALPHA • PRIVACY MODULE
          </Text>
        </View>
        {/* <View className="mt-12 opacity-30 items-center">
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Develop By HTOO MYAT NYI NYI
          </Text>
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            All rights reserved © 2026
          </Text>
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            [EMAIL_ADDRESS]
          </Text>
          <Text
            className={`text-[9px] mt-2 font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            V 2.4.1009-ALPHA • 2026 PRIVACY ACT
          </Text>
        </View> */}
      </ScrollView>
    </View>
  );
}

// --- Components ---

const PolicyAccordion = ({ title, content, icon, isDark }: any) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View
      className={`border-b ${isDark ? "border-slate-800" : "border-gray-50"}`}
    >
      <TouchableOpacity
        onPress={toggle}
        className="flex-row items-center px-6 py-5"
      >
        <View
          className={`w-8 h-8 rounded-xl items-center justify-center mr-4 ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}
        >
          <Ionicons
            name={icon}
            size={18}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </View>
        <Text
          className={`flex-1 font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {title}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#CBD5E1"
        />
      </TouchableOpacity>
      {expanded && (
        <View className="px-6 pb-6 ml-12">
          <Text
            className={`text-[13px] leading-[20px] font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            {content}
          </Text>
        </View>
      )}
    </View>
  );
};

const GridCard = ({ icon, label, sub, color, isDark }: any) => (
  <TouchableOpacity
    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    className={`w-[48%] border p-5 rounded-[28px] mb-4 shadow-sm ${
      isDark
        ? "bg-slate-800/50 border-slate-700 shadow-black"
        : "bg-white border-gray-50 shadow-gray-100"
    }`}
  >
    <View
      style={{ backgroundColor: `${color}20` }}
      className="w-10 h-10 rounded-2xl items-center justify-center mb-3"
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text
      className={`font-black text-sm tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
    >
      {label}
    </Text>
    <Text
      className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}
    >
      {sub}
    </Text>
  </TouchableOpacity>
);
