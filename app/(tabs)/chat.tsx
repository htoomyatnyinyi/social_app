import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  useGetChatRoomsQuery,
  useGetPublicChatQuery,
  useCreateChatRoomMutation,
} from "../../store/chatApi";
import { useSearchUsersQuery } from "../../store/authApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatListScreen() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const [search, setSearch] = useState("");

  const {
    data: rooms,
    isLoading,
    refetch,
    isFetching,
  } = useGetChatRoomsQuery({});
  const { data: publicRoom } = useGetPublicChatQuery({});
  const { data: searchedUsers } = useSearchUsersQuery(search, {
    skip: !search,
  });
  const [createChatRoom] = useCreateChatRoomMutation();

  // Refetch chat rooms when the tab is focused so last-message previews are fresh
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleStartChat = async (otherUserId: string) => {
    try {
      const room = await createChatRoom(otherUserId).unwrap();
      setSearch("");
      router.push(`/chat/${room.id}?title=Chat`);
    } catch (e) {
      console.error(e);
      alert("Follow each other to start a private chat");
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const ChatItem = ({ item }: { item: any }) => {
    const otherUser = item.users.find((u: any) => u.id !== user?.id);
    const lastMessage = item.messages?.[0];

    return (
      <TouchableOpacity
        onPress={() =>
          router.push(`/chat/${item.id}?title=${otherUser?.name || "Chat"}`)
        }
        activeOpacity={0.7}
        className="flex-row p-4 items-center bg-white active:bg-gray-50"
      >
        <View className="relative">
          <Image
            source={{
              uri: otherUser?.image || "https://via.placeholder.com/56",
            }}
            className="w-14 h-14 rounded-full bg-gray-100"
          />
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        </View>
        <View className="flex-1 ml-4 border-b border-gray-50 pb-4 h-full justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className="font-bold text-[16px] text-gray-900"
              numberOfLines={1}
            >
              {otherUser?.name || "Unknown"}
            </Text>
            {lastMessage && (
              <Text className="text-gray-400 text-xs">
                {formatLastMessageTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View className="flex-row justify-between items-center mr-2">
            <Text
              className="text-gray-500 text-[14px] flex-1 mr-2"
              numberOfLines={1}
            >
            <Text className="text-gray-500 text-[14px] flex-1 mr-2" numberOfLines={1}>
              {lastMessage?.senderId === user?.id ? "You: " : ""}
              {lastMessage?.content || "Start a conversation"}
            </Text>
            {item.unreadCount > 0 && (
              <View className="bg-[#1d9bf0] rounded-full px-2 py-0.5">
                <Text className="text-white text-[11px] font-bold">
                  {item.unreadCount}
                </Text>
                <Text className="text-white text-[11px] font-bold">{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-2.5">
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search for people and groups"
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-[16px] text-gray-900"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {search.length > 0 && searchedUsers && (
        <ScrollView className="bg-white max-h-60 border-b border-gray-100">
          {searchedUsers.map(
            (u: any) =>
              u.id !== user?.id && (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => handleStartChat(u.id)}
                  className="flex-row p-4 items-center border-b border-gray-50 active:bg-sky-50"
                >
                  <Image
                    source={{
                      uri: u.image || "https://via.placeholder.com/40",
                    }}
                    className="w-11 h-11 rounded-full bg-gray-100"
                  />
                  <View className="ml-3">
                    <Text className="font-bold text-[16px] text-gray-900">
                      {u.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      @{u.username || u.name.toLowerCase().replace(/\s/g, "")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ),
          )}
        </ScrollView>
      )}

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatItem item={item} />}
        onRefresh={refetch}
        refreshing={isLoading || isFetching}
        ListHeaderComponent={
          <>
            {/* Public Chat Entry */}
            {publicRoom && !search && (
              <TouchableOpacity
                onPress={() =>
                  router.push(`/chat/${publicRoom?.id}?title=Public Chat`)
                }
                activeOpacity={0.7}
                className="flex-row p-4 items-center bg-sky-50/50 mb-2 mt-1 mx-4 rounded-2xl border border-sky-100"
              >
                <View className="w-12 h-12 rounded-full bg-sky-500 items-center justify-center shadow-sm shadow-sky-300">
                  <Ionicons name="planet" size={26} color="white" />
                </View>
                <View className="ml-4 flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-extrabold text-[16px] text-sky-900">
                      Public Chatroom
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#0EA5E9"
                    />
                  </View>
                  <Text className="text-sky-600 text-sm font-medium">
                    Global community conversation
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 px-10">
            <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="mail-unread-outline" size={40} color="#D1D5DB" />
            </View>
            <Text className="text-2xl font-extrabold text-center mb-2 text-gray-900">
              Inbox Zero
            </Text>
            <Text className="text-gray-500 text-center text-lg leading-6">
              Private messages are here. Search for users to start a safe
              conversation.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => {
          router.push("/chat/new");
        }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#1d9bf0] rounded-full items-center justify-center shadow-xl shadow-sky-500/40"
      >
        <Ionicons name="mail-outline" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
