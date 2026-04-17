import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../context/ThemeContext";
import { useChangePasswordMutation } from "../../store/settingsApi";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Theme Sync
  const isDark = theme?.isDark ?? true;
  const accentColor = theme?.accentColor ?? "#6366F1";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility States
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to protect your account.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Weak Password",
        "For your safety, passwords must be at least 6 characters.",
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await changePassword({ currentPassword, newPassword }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Password updated successfully.", [
        { text: "Finish", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.data?.message || "Failed to update password.");
    }
  };

  if (!theme) return null;

  // Internal Helper Component for Inputs to keep code clean
  const PasswordInput = ({
    label,
    value,
    setter,
    show,
    toggle,
    placeholder,
  }: any) => (
    <View className="mb-5">
      <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      <View
        className={`flex-row items-center px-4 py-4 rounded-2xl border ${
          isDark
            ? "bg-slate-900 border-slate-700"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <Ionicons
          name="key-outline"
          size={18}
          color={isDark ? "#475569" : "#94A3B8"}
        />
        <TextInput
          secureTextEntry={!show}
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
          className={`flex-1 ml-3 text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        />
        <TouchableOpacity onPress={toggle}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={accentColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between px-5 h-24"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 rounded-xl items-center justify-center border ${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-100 shadow-sm"
          }`}
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
            Security
          </Text>
          <Text
            style={{ color: accentColor }}
            className="text-[9px] font-black tracking-[3px] uppercase mt-1"
          >
            Access Key
          </Text>
        </View>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8 items-center">
            <View
              style={{ backgroundColor: `${accentColor}20` }}
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
            >
              <Ionicons name="finger-print" size={32} color={accentColor} />
            </View>
            <Text
              className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Update Password
            </Text>
          </View>

          {/* Grouped Card */}
          <View
            className={`rounded-[32px] p-6 border ${
              isDark
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              setter={setCurrentPassword}
              show={showCurrent}
              toggle={() => setShowCurrent(!showCurrent)}
              placeholder="••••••••"
            />

            <View
              className={`h-[1px] w-full mb-6 ${isDark ? "bg-slate-700/50" : "bg-gray-100"}`}
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              setter={setNewPassword}
              show={showNew}
              toggle={() => setShowNew(!showNew)}
              placeholder="At least 6 characters"
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              setter={setConfirmPassword}
              show={showConfirm}
              toggle={() => setShowConfirm(!showConfirm)}
              placeholder="Repeat new password"
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading
                ? isDark
                  ? "#1E293B"
                  : "#E2E8F0"
                : accentColor,
              marginTop: 32,
            }}
            className="py-5 rounded-[24px] items-center shadow-xl shadow-indigo-500/20"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black uppercase tracking-widest">
                Update Password
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 mb-10"
          >
            <Text className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              Back to Settings
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
// import React, { useState } from "react";
// import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useChangePasswordMutation } from "../../store/settingsApi";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function ChangePasswordScreen() {
//   const router = useRouter();
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [changePassword, { isLoading }] = useChangePasswordMutation();

//   const handleChangePassword = async () => {
//     if (!currentPassword || !newPassword || !confirmPassword) {
//       Alert.alert("Error", "Please fill in all fields");
//       return;
//     }

//     if (newPassword !== confirmPassword) {
//       Alert.alert("Error", "New passwords do not match");
//       return;
//     }

//     if (newPassword.length < 6) {
//       Alert.alert("Error", "Password must be at least 6 characters long");
//       return;
//     }

//     try {
//       await changePassword({ currentPassword, newPassword }).unwrap();
//       Alert.alert("Success", "Password updated successfully", [
//         { text: "OK", onPress: () => router.back() },
//       ]);
//     } catch (error: any) {
//       Alert.alert("Error", error.data?.message || "Failed to update password");
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
//         <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <Text className="text-lg font-bold ml-4">Change Password</Text>
//       </View>

//       <View className="p-4 mt-4">
//         <View className="mb-4">
//           <Text className="text-gray-700 mb-2 font-medium">
//             Current Password
//           </Text>
//           <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
//             <TextInput
//               secureTextEntry
//               value={currentPassword}
//               onChangeText={setCurrentPassword}
//               placeholder="Enter current password"
//               className="text-base text-gray-900"
//             />
//           </View>
//         </View>

//         <View className="mb-4">
//           <Text className="text-gray-700 mb-2 font-medium">New Password</Text>
//           <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
//             <TextInput
//               secureTextEntry
//               value={newPassword}
//               onChangeText={setNewPassword}
//               placeholder="Enter new password"
//               className="text-base text-gray-900"
//             />
//           </View>
//         </View>

//         <View className="mb-8">
//           <Text className="text-gray-700 mb-2 font-medium">
//             Confirm New Password
//           </Text>
//           <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
//             <TextInput
//               secureTextEntry
//               value={confirmPassword}
//               onChangeText={setConfirmPassword}
//               placeholder="Confirm new password"
//               className="text-base text-gray-900"
//             />
//           </View>
//         </View>

//         <TouchableOpacity
//           onPress={handleChangePassword}
//           disabled={isLoading}
//           className={`py-4 rounded-xl items-center ${
//             isLoading ? "bg-gray-400" : "bg-black"
//           }`}
//         >
//           <Text className="text-white font-bold text-lg">
//             {isLoading ? "Updating..." : "Update Password"}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }
