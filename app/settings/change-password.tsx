import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useChangePasswordMutation } from "../../store/settingsApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      Alert.alert("Success", "Password updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.data?.message || "Failed to update password");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Change Password</Text>
      </View>

      <View className="p-4 mt-4">
        <View className="mb-4">
          <Text className="text-gray-700 mb-2 font-medium">
            Current Password
          </Text>
          <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <TextInput
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              className="text-base text-gray-900"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 mb-2 font-medium">New Password</Text>
          <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              className="text-base text-gray-900"
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-gray-700 mb-2 font-medium">
            Confirm New Password
          </Text>
          <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <TextInput
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              className="text-base text-gray-900"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={isLoading}
          className={`py-4 rounded-xl items-center ${
            isLoading ? "bg-gray-400" : "bg-black"
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {isLoading ? "Updating..." : "Update Password"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
