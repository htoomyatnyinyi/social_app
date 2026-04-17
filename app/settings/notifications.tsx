import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
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

// Define the shape of your settings for TS
interface NotificationSettings {
  pushEnabled: boolean;
  likes: boolean;
  replies: boolean;
  follows: boolean;
  reposts: boolean;
  mentions: boolean;
  messages: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // 1. ALL HOOKS FIRST
  const { data: preferences, isLoading: isFetching } =
    useGetNotificationPreferencesQuery({}, { skip: !theme });
  const [updatePreferences, { isLoading: isUpdating }] =
    useUpdateNotificationPreferencesMutation();

  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    likes: true,
    replies: true,
    follows: true,
    reposts: true,
    mentions: true,
    messages: true,
  });

  // Sync state when API data arrives
  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  // 2. THEME DEFAULTS
  const isDark = theme?.isDark ?? true;
  const accentColor = theme?.accentColor ?? "#6366F1";

  // 3. THE FIXED TOGGLE FUNCTION
  const toggleSwitch = async (key: keyof NotificationSettings) => {
    // Optimistic Update: Update UI immediately
    const previousSettings = { ...settings };
    const newValue = !settings[key];
    const updatedSettings = { ...settings, [key]: newValue };

    setSettings(updatedSettings);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Send to server
      await updatePreferences(updatedSettings).unwrap();
    } catch (error) {
      // Rollback if server fails
      setSettings(previousSettings);
      console.error("Failed to update notification setting:", error);
    }
  };

  // 4. EARLY RETURN (Safe here)
  if (!theme) return null;

  const sections = [
    {
      title: "Main Control",
      items: [
        {
          id: "pushEnabled",
          label: "Push Notifications",
          sublabel: "Master switch for all alerts",
          icon: "notifications-outline",
        },
      ],
    },
    {
      title: "Interactions",
      items: [
        {
          id: "likes",
          label: "Likes",
          sublabel: "Activity on your posts",
          icon: "heart-outline",
        },
        {
          id: "replies",
          label: "Replies",
          sublabel: "Comments on your posts",
          icon: "chatbubble-outline",
        },
        {
          id: "mentions",
          label: "Mentions",
          sublabel: "When someone tags you",
          icon: "at-outline",
        }, // Added
        {
          id: "reposts",
          label: "Reposts",
          sublabel: "When your content is shared",
          icon: "repeat-outline",
        }, // Added
        {
          id: "follows",
          label: "New Followers",
          sublabel: "Network updates",
          icon: "person-add-outline",
        },
      ],
    },
    {
      title: "Messages", // Added New Section
      items: [
        {
          id: "messages",
          label: "Direct Messages",
          sublabel: "New private messages",
          icon: "mail-outline",
        },
      ],
    },
  ];

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="px-5 h-24 flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 rounded-xl items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </TouchableOpacity>
        <View className="items-center">
          <Text
            className={`font-black tracking-[2px] uppercase ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Notifications
          </Text>
          <Text
            style={{ color: accentColor }}
            className="text-[9px] font-black tracking-[3px] uppercase mt-1"
          >
            Settings
          </Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {isFetching ? (
          <ActivityIndicator color={accentColor} style={{ marginTop: 40 }} />
        ) : (
          sections.map((section, idx) => (
            <View key={idx} className="mt-6 px-5">
              <Text className="px-4 mb-3 text-[10px] font-black text-slate-500 uppercase tracking-[2px]">
                {section.title}
              </Text>
              <View
                className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}
              >
                {section.items.map((item, i) => {
                  const settingKey = item.id as keyof NotificationSettings;
                  const isActive = settings[settingKey];
                  const isDisabled =
                    !settings.pushEnabled && settingKey !== "pushEnabled";

                  return (
                    <View
                      key={i}
                      className={`flex-row items-center px-6 py-5 ${i !== section.items.length - 1 ? "border-b border-slate-700/10" : ""}`}
                      style={{ opacity: isDisabled ? 0.3 : 1 }}
                    >
                      <View
                        style={{
                          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                        }}
                        className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={isActive ? accentColor : "#94A3B8"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {item.label}
                        </Text>
                        <Text className="text-[11px] font-medium text-slate-500 mt-0.5">
                          {item.sublabel}
                        </Text>
                      </View>
                      <Switch
                        value={isActive}
                        onValueChange={() => toggleSwitch(settingKey)}
                        disabled={isDisabled}
                        trackColor={{
                          false: isDark ? "#334155" : "#CBD5E1",
                          true: accentColor,
                        }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
        <View className="mt-12 opacity-30 items-center">
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            HTOO MYAT NYI NYI
          </Text>
          <Text
            className={`text-[9px] mt-2 font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            V 2.4.1009-ALPHA • NOTIFICATION MODULE
          </Text>
        </View>
      </ScrollView>

      {isUpdating && (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <BlurView
            intensity={20}
            tint="dark"
            className="px-6 py-2 rounded-full overflow-hidden border border-white/10"
          >
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color={accentColor} />
              <Text className="ml-3 text-[10px] font-black text-white uppercase tracking-widest">
                Syncing
              </Text>
            </View>
          </BlurView>
        </View>
      )}
    </View>
  );
}
// import { Ionicons } from "@expo/vector-icons";
// import { BlurView } from "expo-blur";
// import * as Haptics from "expo-haptics";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Platform,
//   ScrollView,
//   Switch,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useTheme } from "../../context/ThemeContext";
// import {
//   useGetNotificationPreferencesQuery,
//   useUpdateNotificationPreferencesMutation,
// } from "../../store/settingsApi";

// export default function NotificationSettingsScreen() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { isDark } = useTheme();

//   const { data: preferences, isLoading: isFetching } =
//     useGetNotificationPreferencesQuery({});
//   const [updatePreferences, { isLoading: isUpdating }] =
//     useUpdateNotificationPreferencesMutation();

//   const [settings, setSettings] = useState({
//     pushEnabled: true,
//     likes: true,
//     replies: true,
//     follows: true,
//     reposts: true,
//     mentions: true,
//     messages: true,
//   });

//   useEffect(() => {
//     if (preferences) {
//       setSettings(preferences);
//     }
//   }, [preferences]);

//   const toggleSwitch = async (key: keyof typeof settings) => {
//     const newValue = !settings[key];
//     const newSettings = { ...settings, [key]: newValue };

//     // Optimistic update
//     setSettings(newSettings);
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

//     try {
//       await updatePreferences(newSettings).unwrap();
//     } catch (error) {
//       // Revert on error
//       setSettings(settings);
//       console.error("Failed to update preferences", error);
//     }
//   };

//   const sections = [
//     {
//       title: "Main Control",
//       items: [
//         {
//           id: "pushEnabled",
//           label: "Push Notifications",
//           sublabel: "Master switch for all alerts",
//           icon: "notifications",
//           color: "#0EA5E9",
//         },
//       ],
//     },
//     {
//       title: "Interactions",
//       items: [
//         {
//           id: "likes",
//           label: "Likes",
//           sublabel: "When someone likes your post",
//           icon: "heart",
//           color: "#F43F5E",
//         },
//         {
//           id: "replies",
//           label: "Replies & Mentions",
//           sublabel: "When someone replies or tags you",
//           icon: "chatbubble",
//           color: "#6366F1",
//         },
//         {
//           id: "reposts",
//           label: "Reposts",
//           sublabel: "When someone shares your content",
//           icon: "repeat",
//           color: "#10B981",
//         },
//         {
//           id: "follows",
//           label: "New Followers",
//           sublabel: "When someone starts following you",
//           icon: "person-add",
//           color: "#8B5CF6",
//         },
//       ],
//     },
//     {
//       title: "Messages",
//       items: [
//         {
//           id: "messages",
//           label: "Direct Messages",
//           sublabel: "New private messages in your inbox",
//           icon: "mail",
//           color: "#F59E0B",
//         },
//       ],
//     },
//   ];

//   if (isFetching && !preferences) {
//     return (
//       <View className="flex-1 bg-white items-center justify-center">
//         <ActivityIndicator size="large" color="#0EA5E9" />
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-[#F8FAFC]">
//       {/* Premium Header */}
//       <BlurView
//         intensity={90}
//         tint={isDark ? "dark" : "light"}
//         className={`px-5 pb-5 z-50 border-b ${isDark ? "border-slate-800/50" : "border-gray-100/50"}`}
//         style={{ paddingTop: insets.top + 10 }}
//       >
//         <View className="flex-row items-center">
//           <TouchableOpacity
//             onPress={() => {
//               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//               router.back();
//             }}
//             className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100 mr-4"
//           >
//             <Ionicons name="chevron-back" size={20} color="#64748B" />
//           </TouchableOpacity>
//           <View>
//             <Text className="text-2xl font-black text-gray-900 tracking-[-1px] uppercase">
//               Notifications
//             </Text>
//             <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
//               Manage Your Alerts
//             </Text>
//           </View>
//         </View>
//       </BlurView>

//       <ScrollView
//         className="flex-1"
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 60 }}
//       >
//         {sections.map((section, index) => (
//           <View key={index} className="mt-8 px-5">
//             <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
//               {section.title}
//             </Text>
//             <View className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm shadow-gray-100 overflow-hidden">
//               {section.items.map((item, i) => (
//                 <View
//                   key={i}
//                   style={{
//                     opacity:
//                       !settings.pushEnabled && item.id !== "pushEnabled"
//                         ? 0.5
//                         : 1,
//                   }}
//                   className={`flex-row items-center px-6 py-5 ${i !== section.items.length - 1 ? "border-b border-gray-100/30" : ""}`}
//                 >
//                   <View
//                     style={{ backgroundColor: `${item.color}10` }}
//                     className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
//                   >
//                     <Ionicons
//                       name={item.icon as any}
//                       size={20}
//                       color={item.color}
//                     />
//                   </View>
//                   <View className="flex-1">
//                     <Text className="text-[15px] font-black text-gray-900 tracking-tight">
//                       {item.label}
//                     </Text>
//                     <Text className="text-[11px] font-medium text-gray-400 mt-0.5">
//                       {item.sublabel}
//                     </Text>
//                   </View>
//                   <Switch
//                     value={settings[item.id as keyof typeof settings]}
//                     onValueChange={() =>
//                       toggleSwitch(item.id as keyof typeof settings)
//                     }
//                     disabled={
//                       !settings.pushEnabled && item.id !== "pushEnabled"
//                     }
//                     trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
//                     thumbColor={
//                       Platform.OS === "ios"
//                         ? undefined
//                         : settings[item.id as keyof typeof settings]
//                           ? "#FFFFFF"
//                           : "#F8FAFC"
//                     }
//                   />
//                 </View>
//               ))}
//             </View>
//           </View>
//         ))}

//         <View className="mt-10 px-8 opacity-40">
//           <Text className="text-center text-[11px] font-medium text-gray-500 leading-[18px]">
//             Preferences are synced across all your devices. System-level
//             notification settings in your device settings will override these
//             choices.
//           </Text>
//         </View>
//       </ScrollView>

//       {isUpdating && (
//         <View className="absolute bottom-10 left-0 right-0 items-center">
//           <BlurView
//             intensity={80}
//             tint="dark"
//             className="px-4 py-2 rounded-full overflow-hidden"
//           >
//             <ActivityIndicator size="small" color="#FFFFFF" />
//           </BlurView>
//         </View>
//       )}
//     </View>
//   );
// }
