import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  const sections = [
    {
      id: "01",
      title: "Use of Service",
      content: "You agree to use the service in compliance with all applicable laws and regulations. You are responsible for your content and conduct within the platform.",
      icon: "rocket-outline"
    },
    {
      id: "02",
      title: "User Account",
      content: "You are responsible for safeguarding your account credentials. Any activity performed under your account is your sole responsibility.",
      icon: "shield-checkmark-outline"
    },
    {
      id: "03",
      title: "Content Policy",
      content: "We respect intellectual property. You must not post content that violates copyright, trademark, or any local decency laws. We reserve the right to remove non-compliant content.",
      icon: "layers-outline"
    },
    {
      id: "04",
      title: "Termination",
      content: "We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or harms other users.",
      icon: "flash-off-outline"
    }
  ];

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* Sticky Premium Header */}
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        className={`px-5 pb-5 z-50 border-b ${isDark ? "border-slate-800/50" : "border-gray-100/50"}`}
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className={`w-10 h-10 rounded-2xl items-center justify-center border shadow-sm ${isDark ? "bg-slate-800 border-slate-700 shadow-black" : "bg-white border-gray-50 shadow-gray-100"
              } mr-4`}
          >
            <Ionicons name="chevron-back" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>
          <View>
            <Text className={`text-2xl font-black tracking-[-1px] uppercase ${isDark ? "text-white" : "text-gray-900"}`}>Terms</Text>
            <Text className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}>Legal Agreement</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 60 }}
      >
        {/* Intro Tag */}
        <View className={`mb-8 p-6 rounded-[32px] border ${isDark ? "bg-slate-800/30 border-slate-800" : "bg-white border-gray-100 shadow-sm shadow-gray-100"}`}>
          <Text className={`text-[11px] font-black uppercase tracking-[2px] mb-2 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' })}
          </Text>
          <Text className={`text-base font-medium leading-[24px] ${isDark ? "text-slate-300" : "text-gray-600"}`}>
            By accessing this application, you enter a legally binding contract. Please read these terms carefully to understand your rights and obligations.
          </Text>
        </View>

        {/* Dynamic Sections */}
        {sections.map((item, index) => (
          <View key={index} className="mb-6">
            <View className="flex-row items-center mb-3 px-1">
              <Text style={{ color: accentColor }} className="font-black text-lg tracking-tighter mr-2">{item.id}</Text>
              <View className={`h-[1px] flex-1 ${isDark ? "bg-slate-800" : "bg-gray-100"}`} />
            </View>

            <View className={`p-6 rounded-[32px] border ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"
              }`}>
              <View className="flex-row items-center mb-3">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${isDark ? "bg-slate-700" : "bg-gray-50"}`}>
                  <Ionicons name={item.icon as any} size={16} color={isDark ? accentColor : "#64748B"} />
                </View>
                <Text className={`text-lg font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                  {item.title}
                </Text>
              </View>
              <Text className={`text-[14px] leading-[22px] font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {item.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Acceptance Clause */}
        <View className="mt-4 px-2">
          <Text className={`text-[12px] text-center font-bold italic ${isDark ? "text-slate-600" : "text-gray-400"}`}>
            Continued use of the app constitutes acceptance of any future updates to these terms.
          </Text>
        </View>

        {/* Footer Branding */}
        <View className="mt-12 items-center opacity-30">
          <Text className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}>HTOO MYAT NYI NYI</Text>
          <Text className={`text-[9px] mt-2 font-bold uppercase ${isDark ? "text-slate-400" : "text-gray-500"}`}>Compliance Alpha v2.4.1009</Text>
        </View>
      </ScrollView>
    </View>
  );
}
// import React from "react";
// import { View, Text, TouchableOpacity, ScrollView } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function TermsOfServiceScreen() {
//   const router = useRouter();

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
//         <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <Text className="text-lg font-bold ml-4">Terms of Service</Text>
//       </View>

//       <ScrollView className="flex-1 p-4">
//         <Text className="text-base text-gray-800 leading-6 mb-4">
//           Effective Date: {new Date().toLocaleDateString()}
//         </Text>
//         <Text className="text-base text-gray-800 leading-6 mb-4">
//           By accessing or using our mobile application, you agree to be bound by
//           these Terms of Service.
//         </Text>
//         <Text className="font-bold text-lg mb-2">1. Use of Service</Text>
//         <Text className="text-base text-gray-800 leading-6 mb-4">
//           You agree to use the service in compliance with all applicable laws
//           and regulations. You are responsible for your content and conduct.
//         </Text>
//         <Text className="font-bold text-lg mb-2">2. User Account</Text>
//         <Text className="text-base text-gray-800 leading-6 mb-4">
//           You are responsible for safeguarding your account credential and for
//           any activities or actions under your account.
//         </Text>
//         <Text className="font-bold text-lg mb-2">3. Content Policy</Text>
//         <Text className="text-base text-gray-800 leading-6 mb-4">
//           We respect the intellectual property rights of others. You must not
//           post content that violates copyright or other laws.
//         </Text>
//         <Text className="font-bold text-lg mb-2">4. Termination</Text>
//         <Text className="text-base text-gray-800 leading-6 mb-8">
//           We reserve the right to suspend or terminate your account at our sole
//           discretion, without notice, for conduct that we believe violates these
//           Terms.
//         </Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }
