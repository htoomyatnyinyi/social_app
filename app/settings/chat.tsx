import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { setSpeakerDefault, setAutoMute } from "../../store/settingsSlice";

export default function ChatSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();
  const dispatch = useDispatch();

  const { speakerDefault, autoMute } = useSelector(
    (state: any) => state.settings,
  );

  const toggleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setSpeakerDefault(!speakerDefault));
  };

  const toggleAutoMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setAutoMute(!autoMute));
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
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
              Chat & Calls
            </Text>
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              Audio & Video Settings
            </Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="mt-8 px-1 mb-8">
          <Text
            className={`text-2xl font-black leading-[32px] tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Call performance optimized.
          </Text>
          <Text
            className={`text-[14px] font-medium leading-[22px] mt-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            We have updated our WebRTC engine to better handle audio routing on
            your device. Use the settings below to customize your experience.
          </Text>
        </View>

        <Text
          className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
        >
          Calling Preferences
        </Text>
        <View
          className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
        >
          <View
            className={`flex-row items-center px-6 py-5 border-b ${isDark ? "border-slate-800/50" : "border-gray-50"}`}
          >
            <View
              className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}
            >
              <Ionicons
                name="volume-high"
                size={20}
                color={isDark ? accentColor : "#64748B"}
              />
            </View>
            <View className="flex-1 mr-4">
              <Text
                className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Default to Speaker
              </Text>
              <Text
                className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
              >
                Automatically use speakerphone for video calls
              </Text>
            </View>
            <Switch
              value={speakerDefault}
              onValueChange={toggleSpeaker}
              trackColor={{ false: "#E2E8F0", true: accentColor }}
              thumbColor={
                Platform.OS === "ios"
                  ? undefined
                  : speakerDefault
                    ? "#FFFFFF"
                    : "#F8FAFC"
              }
            />
          </View>

          <View className="flex-row items-center px-6 py-5">
            <View
              className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-slate-700/50" : "bg-gray-50"}`}
            >
              <Ionicons
                name="mic-off"
                size={20}
                color={isDark ? accentColor : "#64748B"}
              />
            </View>
            <View className="flex-1 mr-4">
              <Text
                className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Auto-Mute Microphone
              </Text>
              <Text
                className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
              >
                Join calls with your microphone muted
              </Text>
            </View>
            <Switch
              value={autoMute}
              onValueChange={toggleAutoMute}
              trackColor={{ false: "#E2E8F0", true: accentColor }}
              thumbColor={
                Platform.OS === "ios"
                  ? undefined
                  : autoMute
                    ? "#FFFFFF"
                    : "#F8FAFC"
              }
            />
          </View>
        </View>

        <View className="mt-8 px-1">
          <View
            className={`p-6 rounded-[32px] ${isDark ? "bg-sky-500/10" : "bg-sky-50"}`}
          >
            <View className="flex-row items-center mb-3">
              <Ionicons name="shield-checkmark" size={20} color="#0EA5E9" />
              <Text className="ml-2 text-[13px] font-black text-sky-500 uppercase tracking-wider">
                Hardware Sync Active
              </Text>
            </View>
            <Text
              className={`text-[12px] font-medium leading-[18px] ${isDark ? "text-slate-400" : "text-sky-700"}`}
            >
              Your device is currently using the ultra-low latency audio path.
              This ensures minimum echo and maximum clarity during voice and
              video sessions.
            </Text>
          </View>
        </View>

        <View className="mt-12 opacity-30 items-center">
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            AUDIO ENGINE V4.0.2
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
