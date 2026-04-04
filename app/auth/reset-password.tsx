import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  FadeInDown,
  FadeInUp
} from "react-native-reanimated";

import { useResetPasswordMutation } from "../../store/authApi";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [doReset, { isLoading }] = useResetPasswordMutation();

  const router = useRouter();

  const handleResetPassword = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!verificationCode || !password) {
      setError("Enter the code and your new password.");
      return;
    }
    try {
      await doReset({ email, token: verificationCode, newPassword: password }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Password Updated", "Your password has been reset. Please sign in now.");
      router.replace("/auth");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.data?.message || "Failed to reset password. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 0}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Animated.View
          entering={FadeInDown.duration(1000)}
          className="items-center px-10 pt-20 pb-10"
        >
          <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center shadow-2xl shadow-sky-200 border border-sky-50 mb-8">
            <Ionicons name="lock-open-outline" size={48} color="#0EA5E9" />
          </View>
          <Text className="text-4xl font-black text-gray-900 tracking-[-2px] uppercase text-center">Update</Text>
          <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-[4px] mt-4 text-center">New Credentials</Text>
        </Animated.View>

        <View className="px-8 flex-1">
          <View className="mb-8">
            <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">
              Reset Password
            </Text>
            <Text className="text-gray-400 font-medium text-[13px] uppercase tracking-wider">
              Enter the verification code sent to your email.
            </Text>
          </View>

          {error ? (
            <Animated.View
              entering={FadeInUp}
              className="bg-rose-50/50 border border-rose-100/50 p-4 rounded-[24px] mb-8 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={18} color="#F43F5E" />
              <Text className="text-[#F43F5E] ml-3 font-bold text-[12px] uppercase tracking-wide flex-1">
                {error}
              </Text>
            </Animated.View>
          ) : null}

          <View className="space-y-4">
            <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mb-4">
              <Ionicons name="keypad-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="6-Digit Code"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                maxLength={6}
                className="flex-1 ml-4 text-2xl text-gray-900 tracking-[8px] font-black"
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
            </View>

            <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mb-8">
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#CBD5E1"
                secureTextEntry
                className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={isLoading}
            activeOpacity={0.9}
            className={`py-5 rounded-[28px] items-center mt-10 shadow-xl ${isLoading ? "bg-sky-400" : "bg-[#0EA5E9] shadow-sky-200"}`}
          >
            <Text className="text-white font-black text-xs uppercase tracking-[3px]">
              Set New Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/auth")}
            className="mt-8 mb-10 items-center"
          >
            <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
              Return to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
