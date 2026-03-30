import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpCenterScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const helpCategories = [
        { id: '1', title: 'Account Portal', icon: 'person-outline', description: 'Verification, login issues, and security.' },
        { id: '2', title: 'Sanctuary Safety', icon: 'shield-checkmark-outline', description: 'Reporting, blocking, and community guidelines.' },
        { id: '3', title: 'Ananta Features', icon: 'sparkles-outline', description: 'How to use circles, spirits, and the feed.' },
        { id: '4', title: 'Privacy & Data', icon: 'finger-print-outline', description: 'Manage your data and invisibility settings.' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-lg font-bold ml-4">Ananta Sanctuary</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Search Section */}
                <View className="p-6 bg-gray-50">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">How can we guide you?</Text>
                    <Text className="text-gray-500 mb-4">Search the sanctuary archives for answers.</Text>

                    <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            placeholder="Search help..."
                            className="flex-1 ml-3 text-base"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Categories Grid */}
                <View className="p-4 flex-row flex-wrap justify-between">
                    {helpCategories.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            className="w-[48%] bg-white border border-gray-100 p-4 rounded-2xl mb-4 shadow-sm"
                            onPress={() => {/* Navigate to sub-category */ }}
                        >
                            <View className="bg-indigo-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
                                <Ionicons name={item.icon as any} size={22} color="#4F46E5" />
                            </View>
                            <Text className="font-bold text-gray-900 mb-1">{item.title}</Text>
                            <Text className="text-xs text-gray-500 leading-4">{item.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Help List */}
                <View className="px-4 mb-8">
                    <Text className="font-bold text-lg mb-4">Frequently Asked</Text>
                    <FAQItem title="How do I permanently dissolve my account?" />
                    <FAQItem title="Recovering a lost access key" />
                    <FAQItem title="Myanmar community guidelines 2026" />
                </View>

                {/* Contact Support Footer */}
                <View className="mx-4 p-6 bg-indigo-600 rounded-3xl mb-10 shadow-lg shadow-indigo-200">
                    <Text className="text-white text-lg font-bold mb-1">Still need help?</Text>
                    <Text className="text-indigo-100 mb-4">Our guides are available 24/7 in the Sanctuary.</Text>
                    <TouchableOpacity className="bg-white py-3 rounded-xl items-center">
                        <Text className="text-indigo-600 font-bold">Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Sub-component for FAQ items
const FAQItem = ({ title }: { title: string }) => (
    <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-50">
        <Text className="text-gray-700 flex-1 pr-4">{title}</Text>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
);