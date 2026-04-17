import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { logout } from "../../store/authSlice";
import { useLazyGetAccountArchiveQuery } from "../../store/settingsApi";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.user);

  const [getAccountArchive, { isLoading: isDownloadingArchive }] =
    useLazyGetAccountArchiveQuery();

  const maskEmail = (email: string) => {
    const trimmed = email.trim();
    const parts = trimmed.split("@");
    if (parts.length !== 2) return trimmed;
    const [name, domain] = parts;
    if (name.length <= 2) return `${name[0] || ""}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  };

  const usernameValue = user?.username
    ? String(user.username).startsWith("@")
      ? String(user.username)
      : `@${user.username}`
    : "Not Added";

  const emailValue = user?.email ? maskEmail(String(user.email)) : "Not Added";
  const phoneValue = user?.phone ? String(user.phone) : "Not Added";

  const handleDownloadArchive = async () => {
    if (isDownloadingArchive) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const archive = await getAccountArchive({}).unwrap();

      const fileName = `account-archive-${Date.now()}.json`;
      const baseDir =
        (FileSystem as any).documentDirectory ||
        (FileSystem as any).cacheDirectory ||
        "";
      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(archive, null, 2),
      );

      Alert.alert("Download ready", `Saved to: ${fileUri}`);
      void Linking.openURL(fileUri).catch(() => {});
    } catch (error: any) {
      Alert.alert(
        "Download failed",
        error?.data?.message || "Please try again later.",
      );
    }
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
              Account
            </Text>
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              Information & Data
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
            Your core details.
          </Text>
          <Text
            className={`text-[14px] font-medium leading-[22px] mt-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            See information about your account, download an archive of your
            data, or learn about your account deactivation options.
          </Text>
        </View>

        {/* Info Grid */}
        <Text
          className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
        >
          Account Information
        </Text>
        <View
          className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
        >
          <InfoItem
            icon="at"
            title="Username"
            desc="Change your @handle"
            value={usernameValue}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/profile/update");
            }}
            isDark={isDark}
            accentColor={accentColor}
          />

          <InfoItem
            icon="mail"
            title="Email Address"
            desc="Update your login email"
            value={emailValue}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/settings/change-email");
            }}
            isDark={isDark}
            accentColor={accentColor}
          />

          <InfoItem
            icon="call"
            title="Phone Number"
            desc="Add or update your number"
            value={phoneValue}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/settings/change-phone");
            }}
            isDark={isDark}
            accentColor={accentColor}
            isLast
          />
        </View>

        {/* Data & History */}
        <View className="mt-8">
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Data & History
          </Text>
          <View
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100"}`}
          >
            <InfoItem
              icon="download"
              title="Download Your Data"
              desc="Get a copy of your info"
              onPress={handleDownloadArchive}
              isDark={isDark}
              accentColor={accentColor}
              isLast
            />
          </View>
        </View>

        {/* Account Deactivation / Danger */}
        <View className="mt-8">
          <Text
            className={`px-1 mb-3 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-rose-500/80" : "text-rose-400"}`}
          >
            Danger Zone
          </Text>
          <View
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100"}`}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  "Deactivate Account",
                  "This will log you out temporarily. You can sign in again anytime.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Log out",
                      style: "destructive",
                      onPress: () => {
                        dispatch(logout());
                        router.replace("/auth");
                      },
                    },
                  ],
                );
              }}
              className={`flex-row items-center px-6 py-5 border-b ${isDark ? "border-rose-500/20" : "border-rose-100"}`}
            >
              <View
                className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}
              >
                <Ionicons name="power" size={20} color="#F43F5E" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-[15px] font-black tracking-tight ${isDark ? "text-rose-400" : "text-rose-500"}`}
                >
                  Deactivate Account
                </Text>
                <Text
                  className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-rose-400/70" : "text-rose-400/80"}`}
                >
                  Take a temporary break
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#F43F5E" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.push("/settings/delete-account");
              }}
              className={`flex-row items-center px-6 py-5`}
            >
              <View
                className={`w-10 h-10 rounded-2xl items-center justify-center mr-4 ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}
              >
                <Ionicons name="trash" size={20} color="#F43F5E" />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-[15px] font-black tracking-tight ${isDark ? "text-rose-400" : "text-rose-500"}`}
                >
                  Delete Account
                </Text>
                <Text
                  className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-rose-400/70" : "text-rose-400/80"}`}
                >
                  Permanently erase your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#F43F5E" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-12 opacity-30 items-center">
          <Text
            className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}
          >
            HTOO MYAT NYI NYI
          </Text>
          <Text
            className={`text-[9px] mt-2 font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
          >
            V 2.4.1009-ALPHA
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const InfoItem = ({
  icon,
  title,
  desc,
  value,
  onPress,
  isDark,
  accentColor,
  isLast,
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center px-6 py-5 ${!isLast ? (isDark ? "border-b border-slate-800/50" : "border-b border-gray-50") : ""}`}
  >
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
    {value && (
      <Text
        className={`text-[12px] font-bold mr-2 ${isDark ? "text-slate-500" : "text-gray-400"}`}
      >
        {value}
      </Text>
    )}
    <Ionicons
      name="chevron-forward"
      size={18}
      color={isDark ? "#334155" : "#CBD5E1"}
    />
  </TouchableOpacity>
);
