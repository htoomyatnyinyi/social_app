import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // Ensure you have expo-linear-gradient installed
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPortalScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      {/* Dynamic Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()} className="bg-white/10 p-2 rounded-full">
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Privacy Portal</Text>
        <TouchableOpacity className="bg-indigo-500/20 p-2 rounded-full border border-indigo-500/30">
          <Ionicons name="shield-checkmark" size={20} color="#818CF8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Hero Card - The Digital Identity */}
        <LinearGradient
          colors={['#1E1B4B', '#312E81']}
          className="rounded-[32px] p-6 mt-4 mb-8 border border-white/10 shadow-2xl"
        >
          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-indigo-200 text-xs uppercase tracking-widest font-bold">Secure Archive</Text>
              <Text className="text-white text-2xl font-bold mt-1">My Digital Footprint</Text>
            </View>
            <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 self-start">
              <Text className="text-emerald-400 text-[10px] font-bold">SECURE</Text>
            </View>
          </View>

          <Text className="text-indigo-100/60 text-sm leading-5 mb-6">
            Everything you've created in the Sanctuary is encrypted and under your control.
          </Text>

          <View className="flex-row gap-x-2">
            <TouchableOpacity className="bg-white/10 flex-1 py-3 rounded-2xl border border-white/5 items-center">
              <Text className="text-white font-medium">View History</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-indigo-500 flex-1 py-3 rounded-2xl items-center shadow-lg shadow-indigo-500/40">
              <Text className="text-white font-bold">Download Data</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Permissions Grid */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">Visibility Controls</Text>
        <View className="flex-row flex-wrap justify-between mb-8">
          <GridCard icon="eye-off" label="Invisibility" sub="Ghost Mode" color="#A855F7" />
          <GridCard icon="people" label="Audience" sub="Circle Only" color="#3B82F6" />
          <GridCard icon="search" label="Searchable" sub="Allow Discover" color="#F59E0B" />
          <GridCard icon="finger-print" label="Access" sub="Access Keys" color="#EC4899" />
        </View>

        {/* Law & Policy - Glass Cards */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">Legal Protocols</Text>
        <PolicyItem
          title="Retention Protocol"
          desc="Logs kept for 3 years (MM Law 2026)"
          icon="time-outline"
        />
        <PolicyItem
          title="Data Encryption"
          desc="AES-256 Sanctuary Protection"
          icon="lock-closed-outline"
        />

        {/* Danger Zone */}
        <TouchableOpacity
          onPress={() => router.push("/settings/delete-account")}
          className="mt-12 mb-20 bg-red-500/10 border border-red-500/20 p-6 rounded-[28px] items-center flex-row justify-between"
        >
          <View>
            <Text className="text-red-500 font-bold text-lg">Dissolve Existence</Text>
            <Text className="text-red-500/60 text-xs">Permanently erase your account</Text>
          </View>
          <View className="bg-red-500 p-2 rounded-xl">
            <Ionicons name="trash-bin" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-component for the Grid
const GridCard = ({ icon, label, sub, color }) => (
  <TouchableOpacity className="w-[48%] bg-[#18181B] border border-white/5 p-5 rounded-[24px] mb-4">
    <View style={{ backgroundColor: `${color}20` }} className="w-10 h-10 rounded-xl items-center justify-center mb-3">
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text className="text-white font-bold text-sm">{label}</Text>
    <Text className="text-gray-500 text-[10px] mt-1">{sub}</Text>
  </TouchableOpacity>
);

// Sub-component for the policy rows
const PolicyItem = ({ title, desc, icon }) => (
  <TouchableOpacity className="flex-row items-center bg-[#18181B] p-4 rounded-2xl mb-3 border border-white/5">
    <View className="bg-gray-800 p-2 rounded-lg mr-4">
      <Ionicons name={icon} size={18} color="#94A3B8" />
    </View>
    <View className="flex-1">
      <Text className="text-gray-200 font-medium">{title}</Text>
      <Text className="text-gray-500 text-xs">{desc}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#4B5563" />
  </TouchableOpacity>
);
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React from "react";
// import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function PrivacyPolicyScreen() {
//   const router = useRouter();

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       {/* Header */}
//       <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
//         <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <View className="ml-4">
//           <Text className="text-lg font-bold">Privacy Portal</Text>
//           <Text className="text-xs text-gray-400 uppercase tracking-tighter">Ananta Ecosystem</Text>
//         </View>
//       </View>

//       <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
//         {/* Intro */}
//         <View className="mb-8">
//           <Text className="text-2xl font-bold text-gray-900 mb-2">Your Data, Your Sanctuary.</Text>
//           <Text className="text-gray-500 leading-6">
//             In Ananta, privacy isn't a feature—it's the foundation. We align with Myanmar's 2026 Data Protection standards to ensure your digital existence remains yours.
//           </Text>
//         </View>

//         {/* Policy Sections */}
//         <PolicySection
//           icon="eye-off-outline"
//           title="Data Collection"
//           content="We collect only what is necessary: your identifiers and basic device telemetry. We never sell your personal 'spirits' (interactions) to third parties."
//         />

//         <PolicySection
//           icon="timer-outline"
//           title="Retention Policy"
//           content="As per local law, we retain communication logs for 3 years. This data is encrypted and isolated from our primary social feed servers."
//         />

//         <PolicySection
//           icon="shield-half-outline"
//           title="Law Enforcement"
//           content="We only disclose data when presented with valid legal warrants under the Cybersecurity Act. You will be notified if the law permits."
//         />

//         {/* Manage Data Actions */}
//         <View className="mt-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
//           <Text className="font-bold text-gray-900 mb-4">Privacy Controls</Text>

//           <ActionLink
//             label="Download My Data Archive"
//             icon="download-outline"
//             onPress={() => Alert.alert("Archive Request", "Your data package will be ready in 24 hours.")}
//           />

//           <ActionLink
//             label="Manage Blocked Entities"
//             icon="hand-left-outline"
//             onPress={() => router.push("/settings/blocked")}
//           />

//           <TouchableOpacity
//             className="flex-row items-center justify-between py-4"
//             onPress={() => router.push("/settings/delete-account")} // Links to your delete logic
//           >
//             <View className="flex-row items-center">
//               <Ionicons name="trash-outline" size={20} color="#EF4444" />
//               <Text className="ml-3 text-red-600 font-semibold">Dissolve Existence (Delete Account)</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={16} color="#EF4444" />
//           </TouchableOpacity>
//         </View>

//         {/* Footer info */}
//         <Text className="text-center text-gray-400 text-xs mt-10 mb-20">
//           Ananta Social © 2026{"\n"}
//           Compliant with Myanmar Personal Data Protection Act
//         </Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// // Sub-components
// const PolicySection = ({ icon, title, content }: { icon: string; title: string; content: string }) => (
//   <View className="mb-8 flex-row">
//     <View className="bg-indigo-50 w-10 h-10 rounded-full items-center justify-center mr-4">
//       <Ionicons name={icon as any} size={20} color="#4F46E5" />
//     </View>
//     <View className="flex-1">
//       <Text className="font-bold text-gray-900 text-lg mb-1">{title}</Text>
//       <Text className="text-gray-600 leading-6">{content}</Text>
//     </View>
//   </View>
// );

// const ActionLink = ({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) => (
//   <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between py-4 border-b border-gray-100">
//     <View className="flex-row items-center">
//       <Ionicons name={icon as any} size={20} color="#374151" />
//       <Text className="ml-3 text-gray-800 font-medium">{label}</Text>
//     </View>
//     <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
//   </TouchableOpacity>
// );
// // import { Ionicons } from "@expo/vector-icons";
// // import { useRouter } from "expo-router";
// // import React from "react";
// // import { ScrollView, Text, TouchableOpacity, View } from "react-native";
// // import { SafeAreaView } from "react-native-safe-area-context";

// // export default function PrivacyPolicyScreen() {
// //   const router = useRouter();

// //   return (
// //     <SafeAreaView className="flex-1 bg-white">
// //       <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
// //         <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
// //           <Ionicons name="arrow-back" size={24} color="black" />
// //         </TouchableOpacity>
// //         <Text className="text-lg font-bold ml-4">Privacy Policy</Text>
// //       </View>

// //       <ScrollView className="flex-1 p-4">
// //         <Text className="text-base text-gray-800 leading-6 mb-4">
// //           Effective Date: {new Date().toLocaleDateString()}
// //         </Text>
// //         <Text className="text-base text-gray-800 leading-6 mb-4">
// //           Your privacy is important to us. This Privacy Policy explains how we
// //           collect, use, and protect your information.
// //         </Text>
// //         <Text className="font-bold text-lg mb-2">
// //           1. Information We Collect
// //         </Text>
// //         <Text className="text-base text-gray-800 leading-6 mb-4">
// //           We collect information you provide directly to us, such as your name,
// //           email address, and profile information.
// //         </Text>
// //         <Text className="font-bold text-lg mb-2">
// //           2. How We Use Your Information
// //         </Text>
// //         <Text className="text-base text-gray-800 leading-6 mb-4">
// //           We use your information to provide, maintain, and improve our
// //           services, and to communicate with you.
// //         </Text>
// //         <Text className="font-bold text-lg mb-2">3. Data Deletion</Text>
// //         <Text className="text-base text-gray-800 leading-6 mb-4">
// //           You can delete your account at any time through the Settings menu.
// //           This will permanently remove your data from our servers.
// //         </Text>
// //         <Text className="font-bold text-lg mb-2">4. Contact Us</Text>
// //         <Text className="text-base text-gray-800 leading-6 mb-8">
// //           If you have any questions about this Privacy Policy, please contact
// //           us.
// //         </Text>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // }
