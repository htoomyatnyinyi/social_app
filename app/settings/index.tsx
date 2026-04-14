import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          router.replace("/auth");
          setTimeout(() => dispatch(logout()), 100);
        },
      },
    ]);
  };


  const sections = [
    {
      title: "Account",
      items: [
        {
          icon: "person",
          label: "Edit Profile",
          sublabel: "Update your profile details",
          onPress: () => router.push("/profile/update"),
        },
        {
          icon: "key",
          label: "Password",
          sublabel: "Change your security password",
          onPress: () => router.push("/settings/change-password"),
        },
      ],
    },
    {
      title: "Privacy & Safety",
      items: [
        {
          icon: "hand-left",
          label: "Blocked Users",
          sublabel: "Manage blocked accounts",
          onPress: () => router.push("/settings/block"),
        },
        {
          icon: "volume-mute",
          label: "Muted Users",
          sublabel: "Manage muted accounts",
          onPress: () => router.push("/settings/mute"),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "notifications",
          label: "Notifications",
          sublabel: "Manage your alerts",
          onPress: () => router.push("/settings/notifications"),
        },
        {
          icon: "moon",
          label: "Appearance",
          sublabel: "Toggle dark mode and accents",
          onPress: () => router.push("/settings/appearance"),
        },
      ],
    },
    {
      title: "Wellness",
      items: [
        {
          icon: "leaf",
          label: "Focus Timer",
          sublabel: "Stay present while scrolling",
          onPress: () => router.push("/settings/meditation"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "help-circle",
          label: "Help Center",
          sublabel: "Visit our support portal",
          onPress: () => router.push("/settings/help"),
        },
        {
          icon: "document-text",
          label: "Terms of Service",
          sublabel: "Read our terms and conditions",
          onPress: () => router.push("/settings/terms"),
        },
        {
          icon: "shield-checkmark",
          label: "Privacy Policy",
          sublabel: "Our commitment to your privacy",
          onPress: () => router.push("/settings/privacy"),
        },
      ],
    },
  ];

  const { isDark, accentColor } = useTheme();

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
            className={`w-10 h-10 rounded-2xl items-center justify-center border shadow-sm ${isDark ? "bg-slate-800 border-slate-700 shadow-black" : "bg-white border-gray-50 shadow-gray-100"
              } mr-4`}
          >
            <Ionicons name="chevron-back" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>
          <View>
            <Text className={`text-2xl font-black tracking-[-1px] uppercase ${isDark ? "text-white" : "text-gray-900"}`}>Settings</Text>
            <Text className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}>App Configuration</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {sections.map((section, index) => (
          <View key={index} className="mt-8 px-5">
            <Text className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              {section.title}
            </Text>
            <View className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800 shadow-black" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"
              }`}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    item.onPress();
                  }}
                  className={`flex-row items-center px-6 py-5 ${i !== section.items.length - 1 ? (isDark ? "border-b border-slate-700/50" : "border-b border-gray-100/30") : ""
                    }`}
                >
                  <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-slate-700/50" : "bg-gray-50"
                    }`}>
                    <Ionicons name={item.icon as any} size={20} color={isDark ? accentColor : "#64748B"} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {item.label}
                    </Text>
                    <Text className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                      {item.sublabel}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? "#334155" : "#CBD5E1"} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View className="mt-12 px-5 mb-10">
          <TouchableOpacity
            onPress={handleLogout}
            className={`flex-row items-center px-6 py-5 rounded-[32px] border mb-6 shadow-sm ${isDark ? "bg-rose-500/10 border-rose-500/20 shadow-black" : "bg-rose-50 border-rose-100/50 shadow-rose-100"
              }`}
          >
            <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-rose-500/20" : "bg-white"
              }`}>
              <Ionicons name="log-out" size={20} color="#F43F5E" />
            </View>
            <Text className="flex-1 text-[15px] font-black text-rose-500 uppercase tracking-widest">
              Log Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/settings/delete-account")}
            className="items-center py-4"
          >
            <Text className={`text-center font-bold text-[12px] uppercase tracking-widest ${isDark ? "text-slate-600" : "text-gray-400"}`}>
              Delete Account
            </Text>
          </TouchableOpacity>

          <View className="items-center mt-12 opacity-20">
            <Text className={`text-[10px] font-black uppercase tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}>Develop By Htoo Myat Nyi Nyi</Text>
            <Text className={`text-[9px] font-bold mt-2 uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>Version Alpha 2.4.1009</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

