import React, { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../context/ThemeContext";
import { logout } from "../../store/authSlice";
import { useChangeEmailMutation } from "../../store/settingsApi";

export default function ChangeEmailScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Appearance Logic
  const isDark = theme?.isDark ?? true;
  const accentColor = theme?.accentColor ?? "#6366F1";

  const [changeEmail, { isLoading }] = useChangeEmailMutation();

  const handleSubmit = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !currentPassword.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Required Fields", "Please fill in both fields to continue.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await changeEmail({ newEmail: trimmedEmail, currentPassword }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Verification Required",
        "Your email has been updated. Please verify your new email and sign in again.",
        [
          {
            text: "Sign In",
            onPress: () => {
              dispatch(logout());
              router.replace("/auth");
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Security Error",
        error?.data?.message || "Failed to update email.",
      );
    }
  };

  if (!theme) return null;

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Zen Header */}
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
            Account
          </Text>
          <Text
            style={{ color: accentColor }}
            className="text-[9px] font-black tracking-[3px] uppercase mt-1"
          >
            Email Security
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
              <Ionicons name="shield-checkmark" size={32} color={accentColor} />
            </View>
            <Text
              className={`text-2xl font-black tracking-tight text-center ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Change Email
            </Text>
            <Text className="text-slate-500 mt-2 text-center px-4 font-medium">
              Update your primary email address. You will be signed out for
              security.
            </Text>
          </View>

          {/* Form Card */}
          <View
            className={`rounded-[32px] p-6 border ${
              isDark
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            {/* New Email Input */}
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              New Email Address
            </Text>
            <View
              className={`flex-row items-center px-4 py-4 rounded-2xl mb-6 border ${
                isDark
                  ? "bg-slate-900 border-slate-700"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={isDark ? "#475569" : "#94A3B8"}
              />
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="new.email@example.com"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                className={`flex-1 ml-3 text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              />
            </View>

            {/* Password Input */}
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Current Password
            </Text>
            <View
              className={`flex-row items-center px-4 py-4 rounded-2xl border ${
                isDark
                  ? "bg-slate-900 border-slate-700"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={isDark ? "#475569" : "#94A3B8"}
              />
              <TextInput
                secureTextEntry={!showPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Required for security"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                className={`flex-1 ml-3 text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={accentColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
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
                Confirm & Re-authenticate
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 mb-10"
          >
            <Text className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              Cancel Change
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
// import React, { useState } from "react";
// import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import * as Haptics from "expo-haptics";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useDispatch } from "react-redux";
// import { logout } from "../../store/authSlice";
// import { useChangeEmailMutation } from "../../store/settingsApi";

// export default function ChangeEmailScreen() {
//   const router = useRouter();
//   const dispatch = useDispatch();

//   const [newEmail, setNewEmail] = useState("");
//   const [currentPassword, setCurrentPassword] = useState("");

//   const [changeEmail, { isLoading }] = useChangeEmailMutation();

//   const handleSubmit = async () => {
//     const trimmedEmail = newEmail.trim();
//     if (!trimmedEmail) {
//       Alert.alert("Error", "Please enter a new email address.");
//       return;
//     }

//     if (!currentPassword.trim()) {
//       Alert.alert("Error", "Please enter your current password.");
//       return;
//     }

//     try {
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//       await changeEmail({ newEmail: trimmedEmail, currentPassword }).unwrap();

//       Alert.alert(
//         "Verify Required",
//         "Your email was updated. Please check your inbox for the OTP verification, then sign in again.",
//         [
//           {
//             text: "OK",
//             onPress: () => {
//               dispatch(logout());
//               router.replace("/auth");
//             },
//           },
//         ],
//       );
//     } catch (error: any) {
//       Alert.alert("Error", error?.data?.message || "Failed to update email.");
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
//         <TouchableOpacity
//           onPress={() => router.back()}
//           className="p-2 -ml-2"
//         >
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <Text className="text-lg font-bold ml-4">Change Email</Text>
//       </View>

//       <View className="p-4 mt-4">
//         <Text className="text-gray-700 mb-2 font-medium">New Email</Text>
//         <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
//           <TextInput
//             keyboardType="email-address"
//             autoCapitalize="none"
//             value={newEmail}
//             onChangeText={setNewEmail}
//             placeholder="you@example.com"
//             placeholderTextColor="#9CA3AF"
//             className="text-base text-gray-900"
//           />
//         </View>

//         <Text className="text-gray-700 mb-2 font-medium">Current Password</Text>
//         <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8">
//           <TextInput
//             secureTextEntry
//             value={currentPassword}
//             onChangeText={setCurrentPassword}
//             placeholder="Enter current password"
//             placeholderTextColor="#9CA3AF"
//             className="text-base text-gray-900"
//           />
//         </View>

//         <TouchableOpacity
//           onPress={handleSubmit}
//           disabled={isLoading}
//           className={`py-4 rounded-xl items-center ${
//             isLoading ? "bg-gray-400" : "bg-black"
//           }`}
//         >
//           <Text className="text-white font-bold text-lg">
//             {isLoading ? "Updating..." : "Update Email"}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }
