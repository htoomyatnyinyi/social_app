import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function PrivacyCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

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
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100 mr-4"
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-black text-gray-900 tracking-[-1px] uppercase">Privacy Center</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Data & Security Controls</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Intro Section */}
        <View className="mt-8 px-1 mb-8">
          <Text className="text-2xl font-black text-gray-900 leading-[32px] tracking-tight">
            Your data, your control. Privacy is the foundation.
          </Text>
          <Text className="text-gray-500 text-[14px] font-medium leading-[22px] mt-4">
            We align with the highest data protection standards to ensure your social experience remains private and secure.
          </Text>
        </View>

        {/* Visibility Controls Grid */}
        <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Visibility Controls</Text>
        <View className="flex-row flex-wrap justify-between">
          <GridCard 
            icon="eye-off" 
            label="Invisibility" 
            sub="Ghost Mode" 
            color="#0EA5E9" 
          />
          <GridCard 
            icon="people" 
            label="Audience" 
            sub="Connections Only" 
            color="#6366F1" 
          />
          <GridCard 
            icon="search" 
            label="Searchable" 
            sub="Discovery Settings" 
            color="#10B981" 
          />
          <GridCard 
            icon="finger-print" 
            label="Access" 
            sub="Access Keys" 
            color="#F59E0B" 
          />
        </View>

        {/* Data Management Section */}
        <View className="mt-8">
            <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Data Management</Text>
            <View className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm shadow-gray-100 overflow-hidden">
                <PolicyItem
                    title="Retention Protocol"
                    desc="Logs managed for 3 years (Compliance 2026)"
                    icon="time-outline"
                    onPress={() => {}}
                />
                <PolicyItem
                    title="Software Encryption"
                    desc="AES-256 platform protection active"
                    icon="lock-closed-outline"
                    onPress={() => {}}
                />
                <PolicyItem
                    title="Download My Data"
                    desc="Request a copy of your social archive"
                    icon="download-outline"
                    onPress={() => {}}
                />
            </View>
        </View>

        {/* Blocks & Mutes Section */}
        <View className="mt-8">
            <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Interactions</Text>
            <View className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm shadow-gray-100 overflow-hidden">
                <PolicyItem
                    title="Blocked Users"
                    desc="Manage users you've blocked"
                    icon="hand-left-outline"
                    onPress={() => router.push("/settings/block")}
                />
                <PolicyItem
                    title="Muted Users"
                    desc="Manage users you've muted"
                    icon="volume-mute-outline"
                    onPress={() => router.push("/settings/mute")}
                />
            </View>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/settings/delete-account");
          }}
          className="mt-12 bg-rose-50 border border-rose-100 p-6 rounded-[32px] items-center flex-row justify-between shadow-sm shadow-rose-100"
        >
          <View>
            <Text className="text-rose-500 font-black text-lg uppercase tracking-tight">Delete Account</Text>
            <Text className="text-rose-400 text-xs font-medium uppercase tracking-widest mt-1">Permanently erase data</Text>
          </View>
          <View className="bg-white p-3 rounded-2xl shadow-sm">
            <Ionicons name="trash" size={24} color="#F43F5E" />
          </View>
        </TouchableOpacity>

        <View className="mt-12 opacity-30">
          <Text className="text-center text-[10px] font-medium text-gray-500 leading-[18px]">
            Privacy Policy Alpha v2.4.1009{"\n"}
            Aligned with Modern Social Standards
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Sub-component for the Grid
const GridCard = ({ icon, label, sub, color }: any) => (
  <TouchableOpacity 
    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    className="w-[48%] bg-white border border-gray-50 p-5 rounded-[28px] mb-4 shadow-sm shadow-gray-100"
  >
    <View style={{ backgroundColor: `${color}10` }} className="w-10 h-10 rounded-2xl items-center justify-center mb-3">
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text className="text-gray-900 font-black text-sm tracking-tight">{label}</Text>
    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{sub}</Text>
  </TouchableOpacity>
);

// Sub-component for the policy rows
const PolicyItem = ({ title, desc, icon, onPress }: any) => (
  <TouchableOpacity 
    onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    }}
    className="flex-row items-center px-6 py-5 border-b border-gray-50"
  >
    <View className="bg-gray-50 p-3 rounded-xl mr-4 border border-gray-100/50">
      <Ionicons name={icon} size={20} color="#64748B" />
    </View>
    <View className="flex-1">
      <Text className="text-gray-900 font-black tracking-tight">{title}</Text>
      <Text className="text-gray-400 text-[11px] font-medium mt-0.5">{desc}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
  </TouchableOpacity>
);
