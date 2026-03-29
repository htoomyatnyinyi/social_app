import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout, 
  SlideInRight,
  SlideOutLeft
} from "react-native-reanimated";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import {
  useSigninMutation,
  useSignupMutation,
  useVerifyCodeMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} from "../store/authApi";
import { setCredentials } from "../store/authSlice";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState(0); // 0: Sign In, 1: Sign Up, 2: OTP, 3: Email Reset, 4: Reset OTP
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const [signin, { isLoading: isSigninLoading }] = useSigninMutation();
  const [verifyCode, { isLoading: isVerifyLoading }] = useVerifyCodeMutation();
  const [reqReset, { isLoading: isReqLoading }] = useRequestPasswordResetMutation();
  const [doReset, { isLoading: isResetLoading }] = useResetPasswordMutation();

  const dispatch = useDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleTabChange = (tab: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    setError("");
  };

  const handleAuth = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (activeTab === 0 && (!email || !password)) {
      setError("Enter credentials to arrive.");
      return;
    }
    if (activeTab === 1 && (!email || !password || !name || !username)) {
      setError("All coordinates are required for presence.");
      return;
    }

    try {
      if (activeTab === 0) {
        const res = await signin({ email, password }).unwrap();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dispatch(setCredentials({ user: res.user, token: res.token }));
        router.replace("/(tabs)");
      } else if (activeTab === 1) {
        await signup({ email, password, name, username }).unwrap();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setActiveTab(2);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err.data?.requiresVerification) {
        setActiveTab(2);
        setError("Coordinate verification required. Check your signal (email).");
      } else {
        setError(err.data?.message || "Arrival failed. Check your credentials.");
      }
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email) {
      setError("We need your email to send a reset signal.");
      return;
    }
    try {
      await reqReset({ email }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveTab(4);
      setVerificationCode("");
      setPassword("");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.data?.message || "Signal failed. Try again later.");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!verificationCode || !password) {
      setError("Enter the code and your new security key.");
      return;
    }
    try {
      await doReset({ email, token: verificationCode, newPassword: password }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveTab(0);
      setPassword("");
      Alert.alert("Pattern Updated", "Your security key has been reset. Please arrive now.");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.data?.message || "Pattern reset failed. Invalid signal.");
    }
  };

  const handleVerify = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!verificationCode) {
      setError("Enter the 6-digit signal to proceed.");
      return;
    }

    try {
      const res = await verifyCode({ email, code: verificationCode }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch(setCredentials({ user: res.user, token: res.token }));
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.data?.message || "Signal verification failed.");
    }
  };

  const isPerformingAction = isSignupLoading || isSigninLoading || isVerifyLoading || isReqLoading || isResetLoading;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 0}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Hero Section */}
        <Animated.View 
          entering={FadeInDown.duration(1000)}
          className="items-center px-10 pt-20 pb-10"
        >
          <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center shadow-2xl shadow-sky-200 border border-sky-50 mb-8">
             <Ionicons name="leaf" size={48} color="#0EA5E9" />
          </View>
          <Text className="text-4xl font-black text-gray-900 tracking-[-2px] uppercase text-center">Oasis</Text>
          <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-[4px] mt-4 text-center">Arrival Sanctuary</Text>
        </Animated.View>

        <View className="px-8 flex-1">
          {/* View Transitions */}
          <Animated.View layout={Layout.springify()} className="mb-8">
            <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">
                {activeTab === 0 && "Welcome Home"}
                {activeTab === 1 && "New Presence"}
                {activeTab === 2 && "Signal Check"}
                {activeTab === 3 && "Restore Access"}
                {activeTab === 4 && "Inbox Insight"}
            </Text>
            <Text className="text-gray-400 font-medium text-[13px] uppercase tracking-wider">
                {activeTab === 0 && "Sync with the global frequency."}
                {activeTab === 1 && "Initialize your coordinate in the Oasis."}
                {activeTab === 2 && `Resonating with ${email || "your email"}.`}
                {activeTab === 3 && "Send a restore pulse to your identity."}
                {activeTab === 4 && `Enter the 6-digit signal for identity verify.`}
            </Text>
          </Animated.View>

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

          <View>
            {activeTab === 1 && (
              <Animated.View entering={FadeInDown} className="space-y-4 mb-4">
                <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50">
                    <Ionicons name="person-outline" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Portait Name"
                        placeholderTextColor="#CBD5E1"
                        className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
                <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mt-4">
                    <Ionicons name="at-outline" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Unique Identity"
                        placeholderTextColor="#CBD5E1"
                        autoCapitalize="none"
                        className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                        value={username}
                        onChangeText={setUsername}
                    />
                </View>
              </Animated.View>
            )}

            {(activeTab === 0 || activeTab === 1) && (
              <Animated.View entering={FadeInDown} className="space-y-4">
                <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50">
                    <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Coordinate Email"
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
                        placeholder="Security Key"
                        placeholderTextColor="#CBD5E1"
                        secureTextEntry
                        className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
              </Animated.View>
            )}

            {activeTab === 2 && (
              <Animated.View entering={FadeInDown} className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mb-8">
                <Ionicons name="keypad-outline" size={20} color="#94A3B8" />
                <TextInput
                  placeholder="6-Digit Signal"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="number-pad"
                  maxLength={6}
                  className="flex-1 ml-4 text-2xl text-gray-900 tracking-[8px] font-black"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
              </Animated.View>
            )}

            {activeTab === 3 && (
              <Animated.View entering={FadeInDown} className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mb-8">
                <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                <TextInput
                  placeholder="Recovery Email"
                  placeholderTextColor="#CBD5E1"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                  value={email}
                  onChangeText={setEmail}
                />
              </Animated.View>
            )}

            {activeTab === 4 && (
              <Animated.View entering={FadeInDown} className="space-y-4">
                <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50">
                    <Ionicons name="keypad-outline" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Recovery Signal"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="number-pad"
                        maxLength={6}
                        className="flex-1 ml-4 text-2xl text-gray-900 tracking-[8px] font-black"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                    />
                </View>
                <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mt-4 mb-8">
                    <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="New Security Key"
                        placeholderTextColor="#CBD5E1"
                        secureTextEntry
                        className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
              </Animated.View>
            )}
          </View>

          <TouchableOpacity
            onPress={
              activeTab === 2 ? handleVerify : 
              activeTab === 3 ? handleForgotPassword : 
              activeTab === 4 ? handleResetPassword : 
              handleAuth
            }
            disabled={isPerformingAction}
            activeOpacity={0.9}
            className={`py-5 rounded-[28px] items-center mt-10 shadow-xl ${
              isPerformingAction ? "bg-sky-400" : "bg-[#0EA5E9] shadow-sky-200"
            }`}
          >
            <Text className="text-white font-black text-xs uppercase tracking-[3px]">
              {activeTab === 0 && "Arrive"}
              {activeTab === 1 && "Initialize"}
              {activeTab === 2 && "Sync Pulse"}
              {activeTab === 3 && "Send Pulse"}
              {activeTab === 4 && "Reset Key"}
            </Text>
          </TouchableOpacity>

          {activeTab === 0 && (
            <TouchableOpacity
              onPress={() => handleTabChange(3)}
              className="mt-6 mb-2 items-center"
            >
              <Text className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">
                Lost your key?
              </Text>
            </TouchableOpacity>
          )}

          {(activeTab === 0 || activeTab === 1) && (
            <View className="flex-row justify-center mt-12 mb-10">
              <Text className="text-gray-400 font-medium text-[13px]">
                {activeTab === 0 ? "New frequency? " : "Already existing? "}
              </Text>
              <TouchableOpacity onPress={() => handleTabChange(activeTab === 0 ? 1 : 0)}>
                <Text className="text-sky-500 font-black text-[13px] uppercase tracking-wider">
                  {activeTab === 0 ? "Generate" : "Arrive"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab >= 2 && (
            <TouchableOpacity
              className="mt-8 mb-10 items-center bg-white py-4 rounded-[24px] border border-gray-100"
              onPress={() => handleTabChange(activeTab === 2 ? 1 : 0)}
            >
              <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
                Return to Previous State
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
