import React, { useState } from "react";
import {
  View,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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
  } = useGetChatRoomsQuery(user?.id);
  const { data: publicRoom } = useGetPublicChatQuery({});
  const { data: searchedUsers } = useSearchUsersQuery(search, {
    skip: !search,
  });
  const [createChatRoom] = useCreateChatRoomMutation();

  const handleStartChat = async (otherUserId: string) => {
    try {
      const room = await createChatRoom([user.id, otherUserId]).unwrap();
      setSearch("");
      router.push({
        pathname: "/chat/[chatId]",
        params: { chatId: room.id, title: "Chat" },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const ChatItem = ({ item }: { item: any }) => {
    const otherUser = item.users.find((u: any) => u.id !== user?.id);
    const lastMessage = item.messages?.[0];

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/chat/[chatId]",
            params: { chatId: item.id, title: otherUser?.name || "Chat" },
          })
        }
        className="flex-row p-4 border-b border-gray-100 items-center active:bg-gray-50 bg-white"
      >
        <Image
          source={{ uri: otherUser?.image || "https://via.placeholder.com/50" }}
          className="w-14 h-14 rounded-full"
        />
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="font-bold text-[16px]" numberOfLines={1}>
              {otherUser?.name || "Unknown"}
            </Text>
            {lastMessage && (
              <Text className="text-gray-500 text-xs">
                {new Date(lastMessage.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Text className="text-gray-500 text-[14px]" numberOfLines={1}>
            {lastMessage?.content || "No messages yet"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search Direct Messages"
            className="flex-1 ml-2 text-[16px]"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Search Results */}
      {search.length > 0 && searchedUsers && (
        <View className="bg-white border-b border-gray-100">
          {searchedUsers.map(
            (u: any) =>
              u.id !== user?.id && (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => handleStartChat(u.id)}
                  className="flex-row p-4 items-center border-b border-gray-50"
                >
                  <Image
                    source={{
                      uri: u.image || "https://via.placeholder.com/40",
                    }}
                    className="w-10 h-10 rounded-full"
                  />
                  <Text className="ml-3 font-semibold text-[16px]">
                    {u.name}
                  </Text>
                </TouchableOpacity>
              ),
          )}
        </View>
      )}

      {/* Public Chat Button */}
      {publicRoom && !search && (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/chat/[chatId]",
              params: { chatId: publicRoom?.id, title: "Public Chat" },
            })
          }
          className="flex-row p-4 border-b border-gray-100 items-center bg-sky-50"
        >
          <View className="w-14 h-14 rounded-full bg-sky-500 items-center justify-center">
            <Ionicons name="globe" size={28} color="white" />
          </View>
          <View className="ml-3">
            <Text className="font-bold text-[16px]">Public Chatroom</Text>
            <Text className="text-sky-600 text-sm font-medium">
              Join the conversation
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Chat List */}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatItem item={item} />}
        onRefresh={refetch}
        refreshing={isLoading || isFetching}
        ListEmptyComponent={
          !isLoading && (
            <View className="items-center justify-center mt-20 px-10">
              <Text className="text-xl font-bold text-center mb-2">
                Welcome to your inbox!
              </Text>
              <Text className="text-gray-500 text-center">
                Private messages are here. Search for users to start a
                conversation.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
