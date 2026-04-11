import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "../../store/settingsApi";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const { data: preferences, isLoading: isFetching } = useGetNotificationPreferencesQuery({});
  const [updatePreferences, { isLoading: isUpdating }] = useUpdateNotificationPreferencesMutation();

  const [settings, setSettings] = useState({
    pushEnabled: true,
    likes: true,
    replies: true,
    follows: true,
    reposts: true,
    mentions: true,
    messages: true,
  });

  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const toggleSwitch = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    
    // Optimistic update
    setSettings(newSettings);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await updatePreferences(newSettings).unwrap();
    } catch (error) {
      // Revert on error
      setSettings(settings);
      console.error("Failed to update preferences", error);
    }
  };

  const sections = [
    {
      title: "Main Control",
      items: [
        {
          id: "pushEnabled",
          label: "Push Notifications",
          sublabel: "Master switch for all alerts",
          icon: "notifications",
          color: "#0EA5E9",
        },
      ],
    },
    {
      title: "Interactions",
      items: [
        {
          id: "likes",
          label: "Likes",
          sublabel: "When someone likes your post",
          icon: "heart",
          color: "#F43F5E",
        },
        {
          id: "replies",
          label: "Replies & Mentions",
          sublabel: "When someone replies or tags you",
          icon: "chatbubble",
          color: "#6366F1",
        },
        {
          id: "reposts",
          label: "Reposts",
          sublabel: "When someone shares your content",
          icon: "repeat",
          color: "#10B981",
        },
        {
          id: "follows",
          label: "New Followers",
          sublabel: "When someone starts following you",
          icon: "person-add",
          color: "#8B5CF6",
        },
      ],
    },
    {
      title: "Messages",
      items: [
        {
          id: "messages",
          label: "Direct Messages",
          sublabel: "New private messages in your inbox",
          icon: "mail",
          color: "#F59E0B",
        },
      ],
    },
  ];

  if (isFetching && !preferences) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
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
            <Text className="text-2xl font-black text-gray-900 tracking-[-1px] uppercase">Notifications</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Your Alerts</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {sections.map((section, index) => (
          <View key={index} className="mt-8 px-5">
            <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
              {section.title}
            </Text>
            <View className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm shadow-gray-100 overflow-hidden">
              {section.items.map((item, i) => (
                <View
                  key={i}
                  style={{ opacity: !settings.pushEnabled && item.id !== 'pushEnabled' ? 0.5 : 1 }}
                  className={`flex-row items-center px-6 py-5 ${i !== section.items.length - 1 ? "border-b border-gray-100/30" : ""}`}
                >
                  <View 
                    style={{ backgroundColor: `${item.color}10` }}
                    className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
                  >
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-black text-gray-900 tracking-tight">
                      {item.label}
                    </Text>
                    <Text className="text-[11px] font-medium text-gray-400 mt-0.5">
                      {item.sublabel}
                    </Text>
                  </View>
                  <Switch
                    value={settings[item.id as keyof typeof settings]}
                    onValueChange={() => toggleSwitch(item.id as keyof typeof settings)}
                    disabled={!settings.pushEnabled && item.id !== 'pushEnabled'}
                    trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
                    thumbColor={Platform.OS === 'ios' ? undefined : (settings[item.id as keyof typeof settings] ? "#FFFFFF" : "#F8FAFC")}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View className="mt-10 px-8 opacity-40">
          <Text className="text-center text-[11px] font-medium text-gray-500 leading-[18px]">
            Preferences are synced across all your devices. System-level notification settings in your device settings will override these choices.
          </Text>
        </View>
      </ScrollView>

      {isUpdating && (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <BlurView intensity={80} tint="dark" className="px-4 py-2 rounded-full overflow-hidden">
            <ActivityIndicator size="small" color="#FFFFFF" />
          </BlurView>
        </View>
      )}
    </View>
  );
}
