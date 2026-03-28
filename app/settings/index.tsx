import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import { useDeleteAccountMutation } from "../../store/settingsApi";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Dissolve Presence", "Are you sure you want to log out of the Oasis?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          dispatch(logout());
          router.replace("/auth");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Erasure",
      "This action is absolute. Your existence in the Oasis will be permanently dissolved. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Account",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount({}).unwrap();
              dispatch(logout());
              router.replace("/auth");
              Alert.alert("Presence Dissolved", "Your account has been successfully erased.");
            } catch (error) {
              Alert.alert("Error", "Failed to erase existence. Try again.");
            }
          },
        },
      ],
    );
  };

  const sections = [
    {
      title: "Being",
      items: [
        {
          icon: "person",
          label: "Portrait Reflect",
          sublabel: "Edit your profile details",
          onPress: () => router.push("/profile/update"),
        },
        {
          icon: "key",
          label: "Credential Pulse",
          sublabel: "Change your security password",
          onPress: () => router.push("/settings/change-password"),
        },
      ],
    },
    {
      title: "Atmosphere",
      items: [
        {
          icon: "notifications",
          label: "Echo Frequencies",
          sublabel: "Manage your notifications",
          onPress: () => Alert.alert("Coming Soon"),
        },
        {
          icon: "moon",
          label: "Luminescence",
          sublabel: "Toggle dark mode experience",
          onPress: () => Alert.alert("Coming Soon"),
        },
      ],
    },
    {
        title: "Spirit",
        items: [
          {
            icon: "leaf",
            label: "Stillness Timer",
            sublabel: "Access your meditation space",
            onPress: () => router.push("/settings/meditation"),
          },
        ],
      },
    {
      title: "Protocol",
      items: [
        {
          icon: "help-circle",
          label: "Oasis Sanctuary",
          sublabel: "Visit the help center",
          onPress: () => Alert.alert("Coming Soon"),
        },
        {
          icon: "document-text",
          label: "Artifact Terms",
          sublabel: "Read our terms of service",
          onPress: () => router.push("/settings/terms"),
        },
        {
          icon: "shield-checkmark",
          label: "Presence Privacy",
          sublabel: "Our commitment to your data",
          onPress: () => router.push("/settings/privacy"),
        },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Header */}
      <BlurView 
        intensity={90} 
        tint="light" 
        className="px-5 pb-5 z-50 border-b border-gray-100/50" 
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
            <TouchableOpacity 
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                }} 
                className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100 mr-4"
            >
                <Ionicons name="chevron-back" size={20} color="#64748B" />
            </TouchableOpacity>
            <View>
                <Text className="text-2xl font-black text-gray-900 tracking-[-1px] uppercase">Coordinate</Text>
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">System Environment</Text>
            </View>
        </View>
      </BlurView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {sections.map((section, index) => (
          <View key={index} className="mt-8 px-5">
            <Text className="px-1 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
              {section.title}
            </Text>
            <View className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm shadow-gray-100 overflow-hidden">
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      item.onPress();
                  }}
                  className={`flex-row items-center px-6 py-5 ${i !== section.items.length - 1 ? "border-b border-gray-100/30" : ""}`}
                >
                  <View className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center mr-4">
                     <Ionicons name={item.icon as any} size={20} color="#64748B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-black text-gray-900 tracking-tight">
                        {item.label}
                    </Text>
                    <Text className="text-[11px] font-medium text-gray-400 mt-0.5">
                        {item.sublabel}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View className="mt-12 px-5 mb-10">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center px-6 py-5 bg-rose-50 rounded-[32px] border border-rose-100/50 mb-6 shadow-sm shadow-rose-100"
          >
            <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-4">
                <Ionicons name="log-out" size={20} color="#F43F5E" />
            </View>
            <Text className="flex-1 text-[15px] font-black text-rose-500 uppercase tracking-widest">
              Dissolve Presence
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDeleteAccount} 
            className="items-center py-4"
          >
            <Text className="text-center text-gray-400 font-bold text-[12px] uppercase tracking-widest">
              {isDeleting ? "Erasing..." : "Erase Permanent Presence"}
            </Text>
          </TouchableOpacity>

          <View className="items-center mt-12 opacity-20">
             <Text className="text-[10px] font-black text-gray-900 uppercase tracking-[4px]">Oasis Social</Text>
             <Text className="text-[9px] font-bold text-gray-500 mt-2 uppercase tracking-widest">Version Alpha 2.4.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
