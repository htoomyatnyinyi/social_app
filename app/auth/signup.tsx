import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSignupMutation } from "../../store/authApi";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const [signup, { isLoading }] = useSignupMutation();

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignup = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!email || !password || !name || !username) {
      setError("Please fill in all the details.");
      return;
    }

    try {
      await signup({ email, password, name, username }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Immediately navigate to OTP verification instead of relying on state in a single screen
      router.push({
        pathname: "/auth/verify",
        params: { email }
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.data?.message || "Sign up failed. Please try again.");
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
            <Ionicons name="leaf" size={48} color="#0EA5E9" />
          </View>
          <Text className="text-4xl font-black text-gray-900 tracking-[-2px] uppercase text-center">Social</Text>
          <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-[4px] mt-4 text-center">Join Our Community</Text>
        </Animated.View>

        <View className="px-8 flex-1">
          <View className="mb-8">
            <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">
              Join Us
            </Text>
            <Text className="text-gray-400 font-medium text-[13px] uppercase tracking-wider">
              Create your account to get started.
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
            <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50">
              <Ionicons name="person-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#CBD5E1"
                className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mt-4">
              <Ionicons name="at-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Username"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mt-4">
              <Ionicons name="mail-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mt-4">
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#CBD5E1"
                secureTextEntry
                className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.9}
            className={`py-5 rounded-[28px] items-center mt-10 shadow-xl ${isLoading ? "bg-sky-400" : "bg-[#0EA5E9] shadow-sky-200"}`}
          >
            <Text className="text-white font-black text-xs uppercase tracking-[3px]">
              Sign Up
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-12 mb-10">
            <Text className="text-gray-400 font-medium text-[13px]">
              Already have an account? 
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sky-500 font-black text-[13px] uppercase tracking-wider">
                {" "}Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
