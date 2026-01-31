import React from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/auth");
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Banner */}
      <View className="h-32 bg-gray-200" />

      {/* Profile Header */}
      <View className="px-4 -mt-12">
        <View className="flex-row justify-between items-end">
          <Image
            source={{ uri: user?.image || "https://via.placeholder.com/100" }}
            className="w-24 h-24 rounded-full border-4 border-white"
          />
          <TouchableOpacity className="border border-gray-300 px-4 py-1.5 rounded-full mb-1">
            <Text className="font-bold">Edit profile</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-2">
          <Text className="text-xl font-bold">{user?.name || "User Name"}</Text>
          <Text className="text-gray-500">
            @{user?.email?.split("@")[0] || "handle"}
          </Text>
        </View>

        <Text className="mt-3 text-[15px]">
          Social app developer exploring the future of mobile UI with
          NativeWind. 🚀
        </Text>

        <View className="flex-row mt-3 items-center">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="text-gray-500 ml-1">Joined January 2026</Text>
        </View>

        <View className="flex-row mt-3 mb-4">
          <View className="flex-row mr-4">
            <Text className="font-bold">128</Text>
            <Text className="text-gray-500 ml-1">Following</Text>
          </View>
          <View className="flex-row">
            <Text className="font-bold">2.4K</Text>
            <Text className="text-gray-500 ml-1">Followers</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100">
        <TouchableOpacity className="flex-1 items-center py-3 border-b-4 border-sky-500">
          <Text className="font-bold">Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 items-center py-3">
          <Text className="text-gray-500 font-bold">Replies</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 items-center py-3">
          <Text className="text-gray-500 font-bold">Media</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 items-center py-3">
          <Text className="text-gray-500 font-bold">Likes</Text>
        </TouchableOpacity>
      </View>

      {/* Settings / Logout */}
      <View className="mt-4 px-4 pb-10">
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center p-3 bg-red-50 rounded-xl"
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text className="ml-3 text-red-500 font-bold text-lg">Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
