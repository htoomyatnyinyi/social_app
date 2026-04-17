import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChangePhoneMutation } from "../../store/settingsApi";

export default function ChangePhoneScreen() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [changePhone, { isLoading }] = useChangePhoneMutation();

  const handleSubmit = async () => {
    const trimmed = phone.trim();

    try {
      await changePhone({
        phone: trimmed.length ? trimmed : undefined,
      }).unwrap();

      Alert.alert("Success", "Phone updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to update phone.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Change Phone</Text>
      </View>

      <View className="p-4 mt-4">
        <Text className="text-gray-700 mb-2 font-medium">Phone Number</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8">
          <TextInput
            keyboardType="phone-pad"
            autoCapitalize="none"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555 123 4567"
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
            {isLoading ? "Updating..." : "Update Phone"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

