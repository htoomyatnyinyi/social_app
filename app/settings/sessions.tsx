import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import {
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
} from "../../store/settingsApi";

export default function SessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  const { data, isLoading, isError } = useGetActiveSessionsQuery({});
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation();

  const handleRevoke = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Revoke Session",
      "Are you sure you want to log out this device? You will need to sign in again on that device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await revokeSession(id).unwrap();
            } catch (error) {
              Alert.alert("Error", "Failed to revoke session.");
            }
          },
        },
      ]
    );
  };

  const formatDevice = (userAgent: string) => {
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("Android")) return "Android Device";
    if (userAgent.includes("Macintosh")) return "MacBook / iMac";
    if (userAgent.includes("Windows")) return "Windows PC";
    return "Unknown Device";
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
              Sessions
            </Text>
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              Active Logins
            </Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="mt-8">
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Logged In Devices
          </Text>

          {isLoading ? (
            <ActivityIndicator color={accentColor} style={{ marginTop: 20 }} />
          ) : isError ? (
            <Text className="text-rose-500 text-center mt-5">Failed to load sessions.</Text>
          ) : (
            <View
              className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
            >
              {data?.sessions.map((session: any, index: number) => (
                <View
                  key={session.id}
                  className={`flex-row items-center px-6 py-5 ${index !== data.sessions.length - 1 ? (isDark ? "border-b border-slate-800" : "border-b border-gray-50") : ""}`}
                >
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}
                  >
                    <Ionicons
                      name={session.device.includes("PC") || session.device.includes("Mac") ? "desktop" : "phone-portrait"}
                      size={24}
                      color={isDark ? "#818CF8" : "#6366F1"}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        className={`text-[15px] font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {formatDevice(session.device)}
                      </Text>
                      {session.isCurrent && (
                        <View className="ml-2 bg-sky-500/10 px-2 py-0.5 rounded-md">
                          <Text className="text-sky-500 text-[9px] font-black uppercase">
                            This Device
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
                    >
                      {session.ip} • {new Date(session.lastActive).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRevoke(session.id)}
                    className={`p-2 rounded-xl ${isDark ? "bg-rose-500/10" : "bg-rose-50"}`}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mt-10 px-6">
          <Text
            className={`text-center text-[12px] font-medium leading-[20px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            These are all the devices where you are currently logged in. You can revoke any session to instantly log out from that device.
          </Text>
        </View>
      </ScrollView>

      {isRevoking && (
        <View className="absolute inset-0 bg-black/20 items-center justify-center z-[100]">
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      )}
    </View>
  );
}
