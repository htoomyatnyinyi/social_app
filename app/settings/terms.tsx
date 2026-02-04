import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Terms of Service</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-base text-gray-800 leading-6 mb-4">
          Effective Date: {new Date().toLocaleDateString()}
        </Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          By accessing or using our mobile application, you agree to be bound by
          these Terms of Service.
        </Text>
        <Text className="font-bold text-lg mb-2">1. Use of Service</Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          You agree to use the service in compliance with all applicable laws
          and regulations. You are responsible for your content and conduct.
        </Text>
        <Text className="font-bold text-lg mb-2">2. User Account</Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          You are responsible for safeguarding your account credential and for
          any activities or actions under your account.
        </Text>
        <Text className="font-bold text-lg mb-2">3. Content Policy</Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">
          We respect the intellectual property rights of others. You must not
          post content that violates copyright or other laws.
        </Text>
        <Text className="font-bold text-lg mb-2">4. Termination</Text>
        <Text className="text-base text-gray-800 leading-6 mb-8">
          We reserve the right to suspend or terminate your account at our sole
          discretion, without notice, for conduct that we believe violates these
          Terms.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
