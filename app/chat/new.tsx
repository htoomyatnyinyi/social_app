import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSearchUsersQuery } from "../../store/authApi";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

export default function NewChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const user = useSelector((state: any) => state.auth.user);

  // RTK Query for searching
  const {
    data: searchedUsers,
    isLoading,
    isFetching,
    refetch,
  } = useSearchUsersQuery(search, {
    skip: search.length < 1, // Don't search for empty strings
  });

  const [createChatRoom, { isLoading: isCreating }] =
    useCreateChatRoomMutation();

  const handleStartChat = async (
    otherUserId: string,
    otherUserName: string,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const room = await createChatRoom(otherUserId).unwrap();
      // Replace to prevent coming back to search screen
      router.replace({
        pathname: `/chat/${room.id}` as any,
        params: {
          title: otherUserName,
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = useMemo(() => {
    return searchedUsers?.filter((u: any) => u.id !== user?.id) || [];
  }, [searchedUsers, user?.id]);

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Premium Header */}
      <BlurView
        intensity={90}
        tint="default"
        className="px-5 pb-5 z-50 border-b border-gray-100/50 dark:border-slate-800/50 shadow-sm shadow-gray-100 dark:shadow-none"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 items-center justify-center border border-gray-50 dark:border-slate-700 shadow-sm shadow-gray-100 dark:shadow-none mr-4"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-[-1.5px] uppercase">
                New Message
              </Text>
              <Text className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                Start a Chat
              </Text>
            </View>
          </View>
        </View>

        {/* Premium Search Bar */}
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-100/80 dark:border-slate-700 rounded-[24px] px-4 py-2.5 shadow-sm shadow-gray-50 dark:shadow-none">
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search users..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-[16px] text-gray-900 dark:text-white font-medium h-10"
            value={search}
            onChangeText={setSearch}
            autoFocus
            autoCorrect={false}
            selectionColor="#0EA5E9"
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && search.length > 0}
              onRefresh={refetch}
              tintColor="#0EA5E9"
            />
          }
        >
          {/* User Results */}
          {filteredUsers.map((u: any, index: number) => (
            <Animated.View
              key={u.id}
              entering={FadeInDown.delay(index * 50)}
            >
              <TouchableOpacity
                onPress={() => handleStartChat(u.id, u.name)}
                activeOpacity={0.8}
                className="flex-row items-center px-5 py-4 active:bg-white/60 dark:active:bg-slate-800/60 mb-1"
              >
                <View className="relative shadow-md shadow-sky-100 dark:shadow-none">
                  <Image
                    source={{
                      uri:
                        u.image ||
                        `https://api.dicebear.com/7.x/avataaars/png?seed=${u.id}`,
                    }}
                    className="w-[60px] h-[60px] rounded-[24px] bg-white dark:bg-slate-800 border border-gray-50 dark:border-slate-700"
                    contentFit="cover"
                    transition={300}
                  />
                  {u.isVerified && (
                    <View className="absolute bottom-0 right-0 w-5 h-5 bg-sky-500 border-2 border-white rounded-full items-center justify-center shadow-sm">
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                  )}
                </View>
                <View className="ml-5 flex-1 border-b border-gray-100/50 dark:border-slate-800/50 pb-4">
                  <Text
                    className="font-black text-[17px] text-gray-900 dark:text-white tracking-tight mb-0.5"
                    numberOfLines={1}
                  >
                    {u.name}
                  </Text>
                  <Text className="text-gray-400 dark:text-slate-500 text-[12px] font-bold uppercase tracking-wider">
                    @{u.username}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Empty Search State */}
          {!search && (
            <View className="items-center justify-center mt-20 px-14 opacity-20">
              <Animated.View entering={ZoomIn}>
                <View className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[40px] items-center justify-center mb-10 shadow-sm border border-gray-100 dark:border-slate-700">
                  <Ionicons name="sparkles" size={48} color="#94A3B8" />
                </View>
              </Animated.View>
              <Text className="text-xl font-black text-center mb-2 text-gray-900 dark:text-white uppercase tracking-widest">
                Find someone
              </Text>
              <Text className="text-gray-400 dark:text-slate-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
                Search by name or username to start a new conversation.
              </Text>
            </View>
          )}

          {/* No Results Found */}
          {search.length > 0 && filteredUsers.length === 0 && !isLoading && (
            <View className="items-center justify-center mt-20 px-14 opacity-20">
              <View className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[40px] items-center justify-center mb-10 shadow-sm border border-gray-100 dark:border-slate-700">
                <Ionicons name="search-outline" size={48} color="#94A3B8" />
              </View>
              <Text className="text-xl font-black text-center mb-2 text-gray-900 dark:text-white uppercase tracking-widest">
                No users found
              </Text>
              <Text className="text-gray-400 dark:text-slate-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
                No users matched &quot;{search}&quot;.
              </Text>
            </View>
          )}

          {/* Loading Indicator for search */}
          {isLoading && search.length > 0 && (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Global Activity Overlay when creating room */}
      {isCreating && (
        <BlurView
          intensity={40}
          tint="default"
          className="absolute inset-0 items-center justify-center z-[100]"
        >
          <View className="bg-white/80 dark:bg-slate-800/80 p-10 rounded-[40px] border border-white dark:border-slate-700 shadow-2xl items-center">
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text className="mt-6 text-[11px] font-black text-sky-600 uppercase tracking-[2px]">
              Starting chat...
            </Text>
          </View>
        </BlurView>
      )}
    </View>
  );
}

