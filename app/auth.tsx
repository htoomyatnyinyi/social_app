import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSignupMutation, useSigninMutation } from "../store/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState(0); // 0: Sign In, 1: Sign Up
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const [signin, { isLoading: isSigninLoading }] = useSigninMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleAuth = async () => {
    setError("");
    try {
      if (activeTab === 0) {
        const res = await signin({ email, password }).unwrap();
        dispatch(setCredentials({ user: res.user, token: res.token }));
        router.replace("/(tabs)");
      } else {
        const res = await signup({ email, password, name }).unwrap();
        dispatch(setCredentials({ user: res.user, token: res.token }));
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.data?.message || "Authentication failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="px-8 justify-center flex-1">
        <View className="items-center mb-10">
          <Ionicons name="logo-twitter" size={50} color="#1d9bf0" />
        </View>

        <Text className="text-3xl font-bold mb-8">
          {activeTab === 0 ? "Log in to X" : "Join X today"}
        </Text>

        {error ? (
          <View className="bg-red-50 p-3 rounded-lg mb-4">
            <Text className="text-red-500 text-center font-medium">
              {error}
            </Text>
          </View>
        ) : null}

        {activeTab === 1 && (
          <View className="mb-4">
            <TextInput
              placeholder="Name"
              className="border border-gray-300 rounded-lg px-4 py-3 text-lg focus:border-sky-500"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View className="mb-4">
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            className="border border-gray-300 rounded-lg px-4 py-3 text-lg focus:border-sky-500"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-8">
          <TextInput
            placeholder="Password"
            secureTextEntry
            className="border border-gray-300 rounded-lg px-4 py-3 text-lg focus:border-sky-500"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          onPress={handleAuth}
          disabled={isSignupLoading || isSigninLoading}
          className={`bg-black py-4 rounded-full items-center mb-6 ${
            isSignupLoading || isSigninLoading ? "opacity-70" : ""
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {activeTab === 0 ? "Log In" : "Create account"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500 text-base">
            {activeTab === 0
              ? "Don't have an account? "
              : "Already have an account? "}
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab(activeTab === 0 ? 1 : 0)}
          >
            <Text className="text-sky-500 font-bold text-base">
              {activeTab === 0 ? "Sign up" : "Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
