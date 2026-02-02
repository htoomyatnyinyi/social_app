import React, { useState } from "react";
import {
  View,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import {
  useGetChatRoomsQuery,
  useGetPublicChatQuery,
  useCreateChatRoomMutation,
} from "../../store/chatApi";
import { useSearchUsersQuery } from "../../store/authApi";

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
                {new Date(lastMessage.createdAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            )}
          </View>
          <Text className="text-gray-500 text-[14px]" numberOfLines={1}>
            {lastMessage?.senderId === user?.id ? "You: " : ""}
            {lastMessage?.content || "Start a conversation"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center border-b border-gray-50">
        <Text className="text-xl font-extrabold text-gray-900">Messages</Text>
        <TouchableOpacity className="ml-auto">
          <Ionicons name="settings-outline" size={22} color="black" />
        </TouchableOpacity>
      </View>

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
                      @{u.name.toLowerCase().replace(/\s/g, "")}
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
          !isLoading && (
            <View className="items-center justify-center mt-20 px-10">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
                <Ionicons
                  name="mail-unread-outline"
                  size={40}
                  color="#D1D5DB"
                />
              </View>
              <Text className="text-2xl font-extrabold text-center mb-2 text-gray-900">
                Inbox Zero
              </Text>
              <Text className="text-gray-500 text-center text-lg leading-6">
                Private messages are here. Search for users to start a safe
                conversation.
              </Text>
            </View>
          )
        }
      />

      <TouchableOpacity
        onPress={() => {}} // Could open a full search modal
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#1d9bf0] rounded-full items-center justify-center shadow-xl shadow-sky-500/40"
      >
        <Ionicons name="mail-outline" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
