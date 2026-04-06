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
  Platform,
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

const ChatItem = React.memo(({ item, index, user, onPress }: { item: any; index: number; user: any; onPress: (item: any) => void }) => {
  const otherUser = item.users.find((u: any) => u.id !== user?.id);
  const lastMessage = item.messages?.[0];

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

  return (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.8}
        className="flex-row px-5 py-4 items-center bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-gray-100/50 dark:border-slate-800/50"
      >
        <View className="relative shadow-md shadow-sky-100 dark:shadow-none">
          <Image
            source={{
              uri:
                otherUser?.image ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.id}`,
            }}
            className="w-[64px] h-[64px] rounded-[24px] bg-white dark:bg-slate-800 border border-gray-50 dark:border-slate-700"
            contentFit="cover"
            transition={300}
          />
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-[#0F172A] rounded-full shadow-sm" />
        </View>

        <View className="flex-1 ml-5 justify-center">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text
              className="font-black text-[17px] text-gray-900 dark:text-white tracking-tight"
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
              className={`text-[14px] leading-5 flex-1 mr-3 ${item.unreadCount > 0 ? "text-gray-900 dark:text-slate-100 font-bold" : "text-gray-500 dark:text-slate-400 font-medium"}`}
              numberOfLines={1}
            >
              {lastMessage?.senderId === user?.id && (
                <Text className="text-sky-500 font-black">You </Text>
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
});

  const handleChatItemPress = useCallback((item: any) => {
    const otherUser = item.users.find((u: any) => u.id !== user?.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${item.id}?title=${otherUser?.name || "Chat"}`);
  }, [user?.id, router]);

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
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Premium Sticky Header */}
      <BlurView
        intensity={90}
        tint="default"
        className="px-5 pb-5 z-50 border-b border-gray-100/50 dark:border-slate-800/50 shadow-sm shadow-gray-100 dark:shadow-none"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-[-1px] uppercase">
              Messages
            </Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Direct Chats
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-100/80 dark:border-slate-700 rounded-[20px] px-4 py-2.5 shadow-sm shadow-gray-50 dark:shadow-none">
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search messages..."
            placeholderTextColor="#CBD5E1"
            className="flex-1 ml-3 text-[15px] text-gray-900 dark:text-white font-bold"
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
        </View>
      </BlurView>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ChatItem 
            item={item} 
            index={index} 
            user={user} 
            onPress={handleChatItemPress} 
          />
        )}
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
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 120 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          <>
            {publicRoom && !search && (
              <Animated.View entering={FadeInRight.delay(200)}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/chat/${publicRoom?.id}?title=Public Lounge`);
                  }}
                  activeOpacity={0.9}
                  className="mx-5 my-8 rounded-[40px] overflow-hidden shadow-xl shadow-sky-100 dark:shadow-none border border-white dark:border-slate-800"
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
                        Public Lounge
                      </Text>
                      <Text className="text-white/80 text-[12px] font-bold uppercase tracking-widest mt-1">
                        Community Chat
                      </Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center mt-32 px-14 opacity-20">
            <View className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[40px] items-center justify-center mb-10 shadow-sm border border-gray-100 dark:border-slate-700">
              <Ionicons name="chatbubbles" size={48} color="#94A3B8" />
            </View>
            <Text className="text-xl font-black text-center mb-2 text-gray-900 dark:text-white uppercase tracking-widest">
              No Messages
            </Text>
            <Text className="text-gray-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
              No conversations started yet. Connect with someone to begin.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        activeOpacity={0.9}
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
        className="absolute bottom-28 right-6 w-16 h-16 bg-sky-500 rounded-[28px] items-center justify-center border-2 border-white/20"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
