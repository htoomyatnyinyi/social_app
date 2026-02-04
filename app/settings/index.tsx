import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import { useDeleteAccountMutation } from "../../store/settingsApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
          router.replace("/auth");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This action cannot be undone. All your data will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount({}).unwrap();
              dispatch(logout());
              router.replace("/auth");
              Alert.alert(
                "Account Deleted",
                "Your account has been successfully deleted.",
              );
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const sections = [
    {
      title: "Account",
      items: [
        {
          icon: "person-outline",
          label: "Edit Profile",
          onPress: () => router.push("/profile/update"),
        },
        {
          icon: "lock-closed-outline",
          label: "Change Password",
          onPress: () => router.push("/settings/change-password"),
        },
        {
          icon: "heart-outline",
          label: "Liked Posts",
          onPress: () =>
            router.push({
              pathname: `/profile/${user.id}`,
              params: { tab: "likes" },
            }),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "notifications-outline",
          label: "Notifications",
          onPress: () => Alert.alert("Coming Soon"),
        },
        {
          icon: "moon-outline",
          label: "Dark Mode",
          onPress: () => Alert.alert("Coming Soon"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "help-circle-outline",
          label: "Help Center",
          onPress: () => Alert.alert("Coming Soon"),
        },
        {
          icon: "document-text-outline",
          label: "Terms of Service",
          onPress: () => router.push("/settings/terms"),
        },
        {
          icon: "shield-checkmark-outline",
          label: "Privacy Policy",
          onPress: () => router.push("/settings/privacy"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Settings</Text>
      </View>

      <ScrollView className="flex-1">
        {sections.map((section, index) => (
          <View key={index} className="mt-6">
            <Text className="px-4 mb-2 text-gray-500 font-bold text-xs uppercase tracking-wider">
              {section.title}
            </Text>
            <View className="bg-white border-t border-b border-gray-100">
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  className={`flex-row items-center px-4 py-4 ${i !== section.items.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <Ionicons name={item.icon as any} size={22} color="#374151" />
                  <Text className="flex-1 ml-3 text-base text-gray-900">
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View className="mt-6 mb-10">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center px-4 py-4 bg-white border-t border-b border-gray-100"
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="flex-1 ml-3 text-base text-red-500 font-medium">
              Log Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteAccount} className="mt-6 mx-4">
            <Text className="text-center text-red-500 text-sm">
              {isDeleting ? "Deleting Account..." : "Delete Account"}
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-400 text-xs mt-8">
            Version 2.3.9
          </Text>
          <Text className="text-center text-gray-400 text-xs mt-2">
            Develop By Oassi Co., Ltd.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
