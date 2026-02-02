import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSignupMutation, useSigninMutation } from "../store/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState(0); // 0: Sign In, 1: Sign Up
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const [signin, { isLoading: isSigninLoading }] = useSigninMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleAuth = async () => {
    setError("");
    if (!email || !password || (activeTab === 1 && (!name || !username))) {
      setError("Please fill in all fields");
      return;
    }

    try {
      if (activeTab === 0) {
        const res = await signin({ email, password }).unwrap();
        dispatch(setCredentials({ user: res.user, token: res.token }));
        router.replace("/(tabs)");
      } else {
        const res = await signup({ email, password, name, username }).unwrap();
        dispatch(setCredentials({ user: res.user, token: res.token }));
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.data?.message || "Authentication failed. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-8 flex-1 justify-center">
          <View className="items-center mb-12">
            <View className="w-16 h-16 bg-[#1d9bf0] rounded-2xl items-center justify-center shadow-xl shadow-sky-500/50">
              <Ionicons name="logo-twitter" size={40} color="white" />
            </View>
          </View>

          <Text className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {activeTab === 0 ? "Welcome back" : "Create account"}
          </Text>
          <Text className="text-gray-500 text-lg mb-10">
            {activeTab === 0
              ? "See what's happening in the world right now."
              : "Join the conversation and stay connected."}
          </Text>

          {error ? (
            <View className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-red-600 ml-2 font-medium flex-1">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="space-y-4">
            {activeTab === 1 && (
              <>
                <View className="mb-4">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:border-[#1d9bf0] flex-row items-center">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-lg text-gray-900"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>
                <View className="mb-4">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:border-[#1d9bf0] flex-row items-center">
                    <Ionicons name="at-outline" size={20} color="#6B7280" />
                    <TextInput
                      placeholder="Username"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-lg text-gray-900"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                </View>
              </>
            )}

            <View className="mb-4">
              <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="flex-1 ml-3 text-lg text-gray-900"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View className="mb-8">
              <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  className="flex-1 ml-3 text-lg text-gray-900"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAuth}
            disabled={isSignupLoading || isSigninLoading}
            activeOpacity={0.8}
            className={`py-4 rounded-2xl items-center shadow-lg shadow-sky-500/30 ${
              isSignupLoading || isSigninLoading ? "bg-sky-400" : "bg-[#1d9bf0]"
            }`}
          >
            <Text className="text-white font-bold text-xl">
              {activeTab === 0 ? "Sign In" : "Get Started"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500 text-base">
              {activeTab === 0
                ? "New to the platform? "
                : "Already have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setActiveTab(activeTab === 0 ? 1 : 0);
                setError("");
              }}
            >
              <Text className="text-[#1d9bf0] font-bold text-base">
                {activeTab === 0 ? "Sign up" : "Log in"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
