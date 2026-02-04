import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSearchUsersQuery } from "../../store/authApi";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewChatScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const user = useSelector((state: any) => state.auth.user);

  const { data: searchedUsers, isLoading } = useSearchUsersQuery(search, {
    skip: !search,
  });
  const [createChatRoom] = useCreateChatRoomMutation();

  const handleStartChat = async (
    otherUserId: string,
    otherUserName: string,
  ) => {
    try {
      const room = await createChatRoom(otherUserId).unwrap();
      // Replace to avoid going back to "New Chat" screen
      router.replace({
        pathname: `/chat/${room.id}`,
        params: { title: otherUserName },
      });
    } catch (e) {
      console.error(e);
      // alert("Failed to start chat");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">New Message</Text>
      </View>

      {/* Search Input */}
      <View className="px-4 py-3 border-b border-gray-50">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-2">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search for people"
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-[16px] text-gray-900 h-10"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {isLoading && (
          <View className="py-10">
            <ActivityIndicator size="small" color="#1d9bf0" />
          </View>
        )}

        {searchedUsers?.map(
          (u: any) =>
            u.id !== user?.id && (
              <TouchableOpacity
                key={u.id}
                onPress={() => handleStartChat(u.id, u.name)}
                className="flex-row items-center px-4 py-3 border-b border-gray-50 active:bg-gray-50"
              >
                <Image
                  source={{ uri: u.image || "https://via.placeholder.com/50" }}
                  className="w-12 h-12 rounded-full bg-gray-200"
                />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-gray-900 text-base">
                    {u.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">@{u.username}</Text>
                </View>
              </TouchableOpacity>
            ),
        )}

        {!search && (
          <View className="p-8 items-center justify-center">
            <Text className="text-gray-400 text-center">
              Search for a user to start a conversation
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
