import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  useGetChatRoomsQuery,
  useGetPublicChatQuery,
} from "../../store/chatApi";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
  ZoomIn,
} from "react-native-reanimated";

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSelector((state: any) => state.auth.user);
  const [search, setSearch] = useState("");

  const {
    data: rooms,
    isLoading,
    isFetching,
    refetch,
  } = useGetChatRoomsQuery({});
  const { data: publicRoom } = useGetPublicChatQuery({});

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

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

  const ChatItem = ({ item, index }: { item: any; index: number }) => {
    const otherUser = item.users.find((u: any) => u.id !== user?.id);
    const lastMessage = item.messages?.[0];

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            //   // original
            router.push(`/chat/${item.id}?title=${otherUser?.name || "Chat"}`);
            //   // // Change this:
            //   // // router.push(`/chat/${item.id}?title=${otherUser?.name}`);

            //   // // To this (if your filename is [chatId].tsx):
            //   // router.push({
            //   //   pathname: "/chat/[chatId]",
            //   //   params: { chatId: item.id, title: otherUser?.name }
            //   // });
          }}

          activeOpacity={0.8}
          className="flex-row px-5 py-4 items-center bg-[#F8FAFC] border-b border-gray-100/50"
        >
          <View className="relative shadow-md shadow-sky-100">
            <Image
              source={{
                uri:
                  otherUser?.image ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.id}`,
              }}
              className="w-[64px] h-[64px] rounded-[24px] bg-white border border-gray-50"
              contentFit="cover"
              transition={300}
            />
            <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
          </View>

          <View className="flex-1 ml-5 justify-center">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text
                className="font-black text-[17px] text-gray-900 tracking-tight"
                numberOfLines={1}
              >
                {otherUser?.name || "Member"}
              </Text>
              {lastMessage && (
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {formatLastMessageTime(lastMessage.createdAt)}
                </Text>
              )}
            </View>

            <View className="flex-row justify-between items-center">
              <Text
                className={`text-[14px] leading-5 flex-1 mr-3 ${item.unreadCount > 0 ? "text-gray-900 font-bold" : "text-gray-500 font-medium"}`}
                numberOfLines={1}
              >
                {lastMessage?.senderId === user?.id ? (
                  <Text className="text-sky-500 font-black">You </Text>
                ) : (
                  ""
                )}
                {lastMessage?.content || "No messages yet..."}
              </Text>
              {item.unreadCount > 0 && (
                <View className="bg-sky-500 min-w-[22px] h-[22px] rounded-[11px] px-1.5 items-center justify-center shadow-md shadow-sky-200">
                  <Text className="text-white text-[10px] font-black">
                    {item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    return rooms?.filter((room: any) => {
      const otherUser = room.users.find((u: any) => u.id !== user?.id);
      return (
        otherUser?.name.toLowerCase().includes(search.toLowerCase()) ||
        otherUser?.username?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [rooms, search, user?.id]);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Sticky Header */}
      <BlurView
        intensity={90}
        tint="light"
        className="px-5 pb-5 z-50 border-b border-gray-100/50 shadow-sm shadow-gray-100"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-2xl font-black text-gray-900 tracking-[-1px] uppercase">
              Messages
            </Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Direct Chats
            </Text>
          </View>
          {/* <TouchableOpacity
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100"
          >
            <Ionicons name="options" size={20} color="#64748B" />
          </TouchableOpacity> */}
        </View>

        {/* Search Header Search Bar */}
        {/* <View className="flex-row items-center bg-white border border-gray-100/80 rounded-[20px] px-4 py-2.5 shadow-sm shadow-gray-50">
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search Messages..."
            placeholderTextColor="#CBD5E1"
            className="flex-1 ml-3 text-[15px] text-gray-900 font-medium"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearch("");
              }}
            >
              <Ionicons name="close-circle" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View> */}
      </BlurView>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ChatItem item={item} index={index} />}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              refetch();
            }}
            tintColor="#0EA5E9"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 20 }}
        ListHeaderComponent={
          <>
            {/* Active Circle Swiper */}
            {/* {!search && (
              <View className="mb-8">
                <View className="px-6 mb-4 flex-row items-center justify-between">
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Temporal Presence
                  </Text>
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingLeft: 22 }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/chat/new");
                    }}
                    className="items-center mr-6"
                  >
                    <View className="w-[66px] h-[66px] rounded-[28px] border-2 border-dashed border-sky-200 items-center justify-center bg-sky-50 shadow-sm shadow-sky-50">
                      <Ionicons name="add" size={28} color="#0EA5E9" />
                    </View>
                    <Text className="text-[10px] font-black text-sky-600 mt-2.5 uppercase tracking-wider">
                      Bond
                    </Text>
                  </TouchableOpacity>
                  {(rooms || []).slice(0, 8).map((room: any, index: number) => {
                    const u = room.users.find((un: any) => un.id !== user?.id);
                    return (
                      <Animated.View
                        key={room.id}
                        entering={ZoomIn.delay(index * 50)}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                            router.push(
                              `/chat/${room.id}?title=${u?.name || "Chat"}`,
                            );
                          }}
                          className="items-center mr-6"
                        >
                          <View className="shadow-md shadow-sky-100">
                            <Image
                              source={{
                                uri:
                                  u?.image ||
                                  `https://api.dicebear.com/7.x/avataaars/png?seed=${u?.id}`,
                              }}
                              className="w-[66px] h-[66px] rounded-[28px] bg-white border border-gray-50"
                              contentFit="cover"
                            />
                          </View>
                          <View className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
                          <Text className="text-[11px] font-black text-gray-900 mt-2.5 tracking-tight">
                            {u?.name.split(" ")[0]}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
              </View>
            )} */}

            {/* Global Oasis Featured Card */}
            {publicRoom && (
              // {publicRoom && !search && (
              <Animated.View entering={FadeInRight.delay(200)}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(
                      `/chat/${publicRoom?.id}?title=Public Group`,
                    );
                  }}
                  activeOpacity={0.9}
                  className="mx-5 mb-8 rounded-[40px] overflow-hidden shadow-xl shadow-sky-100 border border-white"
                >
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000",
                    }}
                    className="w-full h-32 absolute"
                  />
                  <BlurView
                    intensity={70}
                    tint="dark"
                    className="p-6 flex-row items-center h-24 bg-black/30"
                  >
                    <View className="w-14 h-14 rounded-[22px] bg-white/20 items-center justify-center border border-white/40">
                      <Ionicons name="infinite" size={32} color="white" />
                    </View>
                    <View className="ml-5 flex-1">
                      <Text className="font-black text-[20px] text-white tracking-tight uppercase">
                        Public
                      </Text>
                      <Text className="text-white/80 text-[12px] font-bold uppercase tracking-widest mt-1">
                        Community Room
                      </Text>
                    </View>
                    {/* <View className="bg-sky-500/80 px-4 py-2 rounded-2xl border border-white/30 shadow-sm">
                      <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                        Join
                      </Text>
                    </View> */}
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 px-14 opacity-20">
            <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center mb-10 shadow-sm border border-gray-100">
              <Ionicons name="chatbubbles" size={48} color="#94A3B8" />
            </View>
            <Text className="text-xl font-black text-center mb-2 text-gray-900 uppercase tracking-widest">
              No Messages
            </Text>
            <Text className="text-gray-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
              No messages found yet. Start a conversation with someone.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        activeOpacity={0.5}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/chat/new");
        }}
        style={{
          shadowColor: "#0EA5E9",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
          elevation: 10,
        }}
        className="absolute bottom-28 right-6 w-16 h-16 bg-[#0EA5E9] rounded-[24px] items-center justify-center border-2 border-white/20"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
