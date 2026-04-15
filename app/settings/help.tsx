import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    Linking
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

// --- Types ---
interface Category {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
    color: string;
}

interface FAQ {
    id: string;
    title: string;
    slug: string;
}

export default function HelpCenterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark, accentColor } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    // --- Data Definitions ---
    const helpCategories: Category[] = [
        { id: 'account', title: 'Account', icon: 'person-outline', description: 'Verification & Login', color: '#0EA5E9' },
        { id: 'safety', title: 'Safety', icon: 'shield-checkmark-outline', description: 'Reporting & Rules', color: '#6366F1' },
        { id: 'features', title: 'Features', icon: 'sparkles-outline', description: 'Using the App', color: '#F59E0B' },
        { id: 'privacy', title: 'Privacy', icon: 'finger-print-outline', description: 'Data & Security', color: '#10B981' },
    ];

    const allFAQs: FAQ[] = [
        { id: '1', title: 'How do I delete my account?', slug: 'delete-account' },
        { id: '2', title: 'Recovering a lost password', slug: 'password-recovery' },
        { id: '3', title: 'Community guidelines & safety', slug: 'guidelines' },
        { id: '4', title: 'Changing my username', slug: 'change-username' },
        { id: '5', title: 'Troubleshooting login issues', slug: 'login-help' },
    ];

    // --- Search Logic ---
    const filteredFAQs = useMemo(() => {
        return allFAQs.filter(faq =>
            faq.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // --- Actions ---
    const handleContactSupport = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // You can use router.push to a Chat screen or Linking for email
        Linking.openURL('mailto:support@yourdomain.com?subject=Help Request');
    };

    return (
        <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
            {/* Premium Sticky Header */}
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
                        <Text className={`text-2xl font-black tracking-[-1px] uppercase ${isDark ? "text-white" : "text-gray-900"}`}>Help Center</Text>
                        <Text className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-400" : "text-gray-400"}`}>Support & Resources</Text>
                    </View>
                </View>
            </BlurView>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                {/* Search Hero Section */}
                <View className={`p-8 ${isDark ? "bg-slate-900/50" : "bg-white"} border-b ${isDark ? "border-slate-800" : "border-gray-100"}`}>
                    <Text className={`text-3xl font-black leading-tight tracking-tight mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                        How can we{"\n"}help you?
                    </Text>
                    <Text className={`text-[14px] font-medium mb-6 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Search our knowledge base for answers.</Text>

                    <View className={`flex-row items-center rounded-2xl px-4 py-4 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-100"
                        }`}>
                        <Ionicons name="search" size={20} color={isDark ? "#475569" : "#9CA3AF"} />
                        <TextInput
                            placeholder="Search articles..."
                            placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                            className={`flex-1 ml-3 font-bold text-[15px] ${isDark ? "text-white" : "text-gray-900"}`}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Categories Grid */}
                <View className="p-5 flex-row flex-wrap justify-between mt-4">
                    {helpCategories.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                // router.push(`/settings/help/category/${item.id}`);
                            }}
                            className={`w-[48%] p-5 rounded-[32px] mb-4 border shadow-sm ${isDark ? "bg-slate-800/50 border-slate-700 shadow-black" : "bg-white border-gray-50 shadow-gray-100"
                                }`}
                        >
                            <View style={{ backgroundColor: `${item.color}20` }} className="w-12 h-12 rounded-2xl items-center justify-center mb-4">
                                <Ionicons name={item.icon} size={24} color={item.color} />
                            </View>
                            <Text className={`font-black text-[15px] tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>{item.title}</Text>
                            <Text className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                                {item.description}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ Section with Filtered Results */}
                <View className="px-5 mt-4">
                    <Text className={`px-1 mb-4 text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                        {searchQuery ? "Search Results" : "Frequently Asked Questions"}
                    </Text>
                    <View className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-800 shadow-black" : "bg-white border-gray-100 shadow-sm shadow-gray-100"
                        }`}>
                        {filteredFAQs.length > 0 ? (
                            filteredFAQs.map((faq, index) => (
                                <FAQItem
                                    key={faq.id}
                                    isDark={isDark}
                                    title={faq.title}
                                    isLast={index === filteredFAQs.length - 1}
                                    // onPress={() => router.push(`/settings/help/article/${faq.slug}`)}
                                    onPress={() => console.log('FAQ press')}
                                />
                            ))
                        ) : (
                            <View className="p-10 items-center">
                                <Ionicons name="help-circle-outline" size={32} color={isDark ? "#475569" : "#CBD5E1"} />
                                <Text className={`mt-2 font-bold ${isDark ? "text-slate-500" : "text-gray-400"}`}>No results found</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Contact Support Card */}
                <View className="px-5 mt-10">
                    <TouchableOpacity
                        onPress={handleContactSupport}
                        activeOpacity={0.9}
                        style={{ backgroundColor: accentColor }}
                        className="p-8 rounded-[40px] shadow-xl shadow-blue-900/20"
                    >
                        <View className="flex-row justify-between items-start">
                            <View className="flex-1 pr-4">
                                <Text className="text-white text-2xl font-black tracking-tight mb-2">Still need help?</Text>
                                <Text className="text-white/80 font-medium leading-[20px]">
                                    Our support team is available 24/7 to assist with your request.
                                </Text>
                            </View>
                            <View className="bg-white/20 p-4 rounded-3xl">
                                <Ionicons name="chatbubbles" size={30} color="white" />
                            </View>
                        </View>
                        <View className="bg-white mt-6 py-4 rounded-2xl items-center">
                            <Text style={{ color: accentColor }} className="font-black uppercase tracking-widest text-[13px]">Contact Support</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Branding Footer */}
                <View className="mt-12 items-center opacity-30">
                    <Text className={`text-[10px] font-black tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}>HTOO MYAT NYI NYI</Text>
                    <Text className={`text-[9px] mt-2 font-bold uppercase ${isDark ? "text-slate-400" : "text-gray-500"}`}>Support Engine v2.4.1009</Text>
                </View>
            </ScrollView>
        </View>
    );
}

// --- Sub-component ---
const FAQItem = ({
    title,
    isDark,
    isLast,
    onPress
}: {
    title: string;
    isDark: boolean;
    isLast?: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }}
        className={`flex-row items-center justify-between px-6 py-5 ${!isLast ? (isDark ? "border-b border-slate-700/50" : "border-b border-gray-50") : ""
            }`}
    >
        <Text className={`text-[15px] font-bold tracking-tight flex-1 pr-4 ${isDark ? "text-slate-200" : "text-gray-700"}`}>
            {title}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={isDark ? "#475569" : "#D1D5DB"} />
    </TouchableOpacity>
);
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function HelpCenterScreen() {
//     const router = useRouter();
//     const [searchQuery, setSearchQuery] = useState("");

//     const helpCategories = [
//         { id: '1', title: 'Account Settings', icon: 'person-outline', description: 'Verification, login issues, and security.' },
//         { id: '2', title: 'Safety & Reporting', icon: 'shield-checkmark-outline', description: 'Reporting, blocking, and community guidelines.' },
//         { id: '3', title: 'App Features', icon: 'sparkles-outline', description: 'How to use basic social features and the feed.' },
//         { id: '4', title: 'Privacy & Data', icon: 'finger-print-outline', description: 'Manage your personal data and privacy settings.' },
//     ];

//     return (
//         <SafeAreaView className="flex-1 bg-white">
//             {/* Header */}
//             <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
//                 <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
//                     <Ionicons name="arrow-back" size={24} color="black" />
//                 </TouchableOpacity>
//                 <Text className="text-lg font-bold ml-4">Help Center</Text>
//             </View>

//             <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//                 {/* Search Section */}
//                 <View className="p-6 bg-gray-50">
//                     <Text className="text-2xl font-bold text-gray-900 mb-2">How can we help you?</Text>
//                     <Text className="text-gray-500 mb-4">Search our knowledge base for answers.</Text>

//                     <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
//                         <Ionicons name="search" size={20} color="#9CA3AF" />
//                         <TextInput
//                             placeholder="Type your question..."
//                             className="flex-1 ml-3 text-base"
//                             value={searchQuery}
//                             onChangeText={setSearchQuery}
//                         />
//                     </View>
//                 </View>

//                 {/* Categories Grid */}
//                 <View className="p-4 flex-row flex-wrap justify-between">
//                     {helpCategories.map((item) => (
//                         <TouchableOpacity
//                             key={item.id}
//                             className="w-[48%] bg-white border border-gray-100 p-4 rounded-2xl mb-4 shadow-sm"
//                             onPress={() => {/* Navigate to sub-category */ }}
//                         >
//                             <View className="bg-sky-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
//                                 <Ionicons name={item.icon as any} size={22} color="#0EA5E9" />
//                             </View>
//                             <Text className="font-bold text-gray-900 mb-1">{item.title}</Text>
//                             <Text className="text-xs text-gray-500 leading-4">{item.description}</Text>
//                         </TouchableOpacity>
//                     ))}
//                 </View>

//                 {/* Quick Help List */}
//                 <View className="px-4 mb-8">
//                     <Text className="font-bold text-lg mb-4">Frequently Asked Questions</Text>
//                     <FAQItem title="How do I permanently delete my account?" />
//                     <FAQItem title="Recovering a lost password" />
//                     <FAQItem title="Community guidelines and safety" />
//                 </View>

//                 {/* Contact Support Footer */}
//                 <View className="mx-4 p-6 bg-sky-600 rounded-3xl mb-10 shadow-lg shadow-sky-200">
//                     <Text className="text-white text-lg font-bold mb-1">Still need help?</Text>
//                     <Text className="text-sky-100 mb-4">Our support team is available 24/7 to assist you.</Text>
//                     <TouchableOpacity className="bg-white py-3 rounded-xl items-center">
//                         <Text className="text-sky-600 font-bold">Contact Support</Text>
//                     </TouchableOpacity>
//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     );
// }

// // Sub-component for FAQ items
// const FAQItem = ({ title }: { title: string }) => (
//     <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-50">
//         <Text className="text-gray-700 flex-1 pr-4">{title}</Text>
//         <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
//     </TouchableOpacity>
// );