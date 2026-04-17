import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import { useChangeEmailMutation } from "../../store/settingsApi";

export default function ChangeEmailScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [changeEmail, { isLoading }] = useChangeEmailMutation();

  const handleSubmit = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      Alert.alert("Error", "Please enter a new email address.");
      return;
    }

    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await changeEmail({ newEmail: trimmedEmail, currentPassword }).unwrap();

      Alert.alert(
        "Verify Required",
        "Your email was updated. Please check your inbox for the OTP verification, then sign in again.",
        [
          {
            text: "OK",
            onPress: () => {
              dispatch(logout());
              router.replace("/auth");
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to update email.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Change Email</Text>
      </View>

      <View className="p-4 mt-4">
        <Text className="text-gray-700 mb-2 font-medium">New Email</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
          <TextInput
            keyboardType="email-address"
            autoCapitalize="none"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            className="text-base text-gray-900"
          />
        </View>

        <Text className="text-gray-700 mb-2 font-medium">Current Password</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8">
          <TextInput
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#9CA3AF"
            className="text-base text-gray-900"
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className={`py-4 rounded-xl items-center ${
            isLoading ? "bg-gray-400" : "bg-black"
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {isLoading ? "Updating..." : "Update Email"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

