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
} from "../../store/chatApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

export default function ChatListScreen() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const [search, setSearch] = useState("");

  const {
    data: rooms,
    isLoading,
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

  const ChatItem = ({ item, index }: { item: any, index: number }) => {
    const otherUser = item.users.find((u: any) => u.id !== user?.id);
    const lastMessage = item.messages?.[0];

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity
            onPress={() => router.push(`/chat/${item.id}?title=${otherUser?.name || "Chat"}`)}
            activeOpacity={0.6}
            className="flex-row px-5 py-4 items-center bg-white border-b border-gray-50"
        >
            <View className="relative">
                <Image
                    source={{ uri: otherUser?.image || "https://via.placeholder.com/60" }}
                    className="w-[60px] h-[60px] rounded-[24px] bg-gray-100"
                />
                <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full" />
            </View>
            
            <View className="flex-1 ml-4 justify-center">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-black text-[17px] text-gray-900" numberOfLines={1}>
                        {otherUser?.name || "Oasis Member"}
                    </Text>
                    {lastMessage && (
                        <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-tighter">
                            {formatLastMessageTime(lastMessage.createdAt)}
                        </Text>
                    )}
                </View>
                
                <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-[14px] flex-1 mr-3 font-medium" numberOfLines={1}>
                        {lastMessage?.senderId === user?.id ? "You: " : ""}
                        {lastMessage?.content || "Tap to start serenity..."}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View className="bg-sky-500 min-w-[20px] h-5 rounded-full px-1.5 items-center justify-center">
                            <Text className="text-white text-[10px] font-black">{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <BlurView intensity={90} tint="light" className="absolute top-0 left-0 right-0 z-50 pt-12 pb-4 px-5 border-b border-gray-100 flex-row justify-between items-center bg-white/80">
          <View>
              <Text className="text-2xl font-black text-gray-900 tracking-tighter">Messages</Text>
              <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Inner Circle</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-100 shadow-sm">
              <Ionicons name="options-outline" size={20} color="#64748B" />
          </TouchableOpacity>
      </BlurView>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ChatItem item={item} index={index} />}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingTop: 110, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* Search Bar - Integrated in list header */}
            <View className="px-5 py-4">
                <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                    <Ionicons name="search-outline" size={18} color="#94a3b8" />
                    <TextInput
                        placeholder="Search conversations..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-3 text-[16px] text-gray-900 font-medium"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Stories / Active Members */}
            <View className="mb-6">
                <Text className="px-5 mb-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Minds</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                     <TouchableOpacity className="items-center mr-5">
                         <View className="w-16 h-16 rounded-[26px] border-2 border-dashed border-sky-300 items-center justify-center bg-sky-50">
                             <Ionicons name="add" size={24} color="#0EA5E9" />
                         </View>
                         <Text className="text-[11px] font-bold text-gray-500 mt-2">New</Text>
                     </TouchableOpacity>
                     {(rooms || []).slice(0, 5).map((room: any) => {
                         const u = room.users.find((u: any) => u.id !== user?.id);
                         return (
                             <TouchableOpacity key={room.id} className="items-center mr-5">
                                 <Image source={{ uri: u?.image }} className="w-16 h-16 rounded-[26px] bg-gray-200" />
                                 <View className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full" />
                                 <Text className="text-[11px] font-bold text-gray-900 mt-2">{u?.name.split(' ')[0]}</Text>
                             </TouchableOpacity>
                         );
                      })}
                </ScrollView>
            </View>

            {/* Public Chatroom Featured Card */}
            {publicRoom && !search && (
              <Animated.View entering={FadeInRight}>
                <TouchableOpacity
                    onPress={() => router.push(`/chat/${publicRoom?.id}?title=Global Oasis`)}
                    activeOpacity={0.8}
                    className="mx-5 mb-6 rounded-3xl overflow-hidden shadow-md shadow-sky-200"
                >
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000' }} 
                        className="w-full h-24 absolute" 
                    />
                    <BlurView intensity={60} tint="dark" className="p-5 flex-row items-center h-24">
                        <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center border border-white/30">
                            <Ionicons name="leaf" size={24} color="white" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="font-black text-[18px] text-white tracking-tight">Global Oasis</Text>
                            <Text className="text-white/80 text-xs font-medium">Join the collective conscious</Text>
                        </View>
                        <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                            <Text className="text-white text-[10px] font-black uppercase">Join</Text>
                        </View>
                    </BlurView>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 px-10">
            <View className="w-20 h-20 bg-white rounded-3xl items-center justify-center mb-6 shadow-sm border border-gray-100">
              <Ionicons name="chatbubbles-outline" size={32} color="#CBD5E1" />
            </View>
            <Text className="text-2xl font-black text-center mb-1 text-gray-900 tracking-tighter">Serenity in Silence</Text>
            <Text className="text-gray-400 text-center text-[15px] font-medium leading-5">
              Your inbox is empty. Start a conversation with someone in the Oasis.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => router.push("/chat/new")}
        className="absolute bottom-10 right-10 w-16 h-16 bg-[#0EA5E9] rounded-[24px] items-center justify-center shadow-xl shadow-sky-500/40 border-4 border-white"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
