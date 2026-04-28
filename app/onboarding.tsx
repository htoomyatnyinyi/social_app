import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../hooks/useOnboarding";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const onboardingData = [
  {
    title: "Welcome to SocialApp",
    description: "Connect with friends and the world around you.",
    icon: "people",
  },
  {
    title: "Share Moments",
    description: "Post photos, videos, and thoughts instantly.",
    icon: "camera",
  },
  {
    title: "Real-time Chat",
    description: "Message your friends with voice and video calls.",
    icon: "chatbubble-ellipses",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const { isDark } = useTheme();
  const { completeOnboarding } = useOnboarding();

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace("/(tabs)"); // or wherever your main app starts
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const item = onboardingData[currentIndex];

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0B1120]" : "bg-white"}`}>
      {/* Progress Dots */}
      <View className="flex-row justify-center mt-16 gap-2">
        {onboardingData.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-8 bg-sky-500" : "w-2 bg-gray-300 dark:bg-gray-700"}`}
          />
        ))}
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="w-32 h-32 rounded-full bg-sky-100 dark:bg-sky-900/30 items-center justify-center mb-12">
          <Ionicons name={item.icon as any} size={80} color="#0EA5E9" />
        </View>

        <Text
          className={`text-3xl font-bold text-center mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {item.title}
        </Text>

        <Text
          className={`text-lg text-center leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          {item.description}
        </Text>
      </View>

      <View className="px-8 pb-12">
        <TouchableOpacity
          onPress={handleNext}
          className="bg-sky-500 py-4 rounded-2xl mb-4"
        >
          <Text className="text-white text-center font-semibold text-lg">
            {currentIndex === onboardingData.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
        </TouchableOpacity>

        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text
              className={`text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
