import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-base text-gray-800 leading-6 mb-4">
          Effective Date: {new Date().toLocaleDateString()}
        </Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          Your privacy is important to us. This Privacy Policy explains how we
          collect, use, and protect your information.
        </Text>
        <Text className="font-bold text-lg mb-2">
          1. Information We Collect
        </Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          We collect information you provide directly to us, such as your name,
          email address, and profile information.
        </Text>
        <Text className="font-bold text-lg mb-2">
          2. How We Use Your Information
        </Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          We use your information to provide, maintain, and improve our
          services, and to communicate with you.
        </Text>
        <Text className="font-bold text-lg mb-2">3. Data Deletion</Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          You can delete your account at any time through the Settings menu.
          This will permanently remove your data from our servers.
        </Text>
        <Text className="font-bold text-lg mb-2">4. Contact Us</Text>
        <Text className="text-base text-gray-800 leading-6 mb-8">
          If you have any questions about this Privacy Policy, please contact
          us.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
