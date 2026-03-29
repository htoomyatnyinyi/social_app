import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  useGetSuggestionsQuery,
  useFollowUserMutation,
} from "../store/profileApi";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInRight } from "react-native-reanimated";

interface User {
  id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
}

export default function FollowerSuggestions() {
  const router = useRouter();
  const { data: suggestions, isLoading } = useGetSuggestionsQuery({});
  const [followUser] = useFollowUserMutation();
  const currentUser = useSelector((state: any) => state.auth.user);

  const handleFollow = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await followUser(userId).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to bind frequency:", error);
    }
  };

  const renderItem = ({ item, index }: { item: User; index: number }) => (
    <Animated.View 
        entering={FadeInRight.delay(index * 100)}
        className="mr-4 w-44 bg-white rounded-[32px] border border-gray-50 p-5 items-center shadow-sm shadow-gray-100"
    >
      <TouchableOpacity
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/profile/${item.id}`);
        }}
        className="items-center mb-4"
      >
        <Image
          source={{
            uri: item.image || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.id}`,
          }}
          className="w-20 h-20 rounded-[28px] mb-4 bg-gray-50 border border-white shadow-md shadow-sky-100"
          contentFit="cover"
          transition={300}
        />
        <Text
          numberOfLines={1}
          className="text-gray-900 font-black text-[15px] text-center tracking-tight"
        >
          {item.name}
        </Text>
        <Text numberOfLines={1} className="text-sky-500 font-bold text-[11px] text-center uppercase tracking-wider mt-1">
          @{item.username}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-gray-900 py-3.5 px-6 rounded-[22px] w-full mt-2 shadow-lg shadow-gray-200"
        onPress={() => handleFollow(item.id)}
      >
        <Text className="text-white text-[10px] font-black text-center uppercase tracking-[2px]">Resonate</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View className="h-64 items-center justify-center">
        <ActivityIndicator color="#0EA5E9" />
      </View>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View className="py-8 bg-[#F8FAFC] border-b border-gray-100/50">
      <View className="px-6 mb-6 flex-row justify-between items-center">
        <View>
            <Text className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Discover Presence</Text>
            <Text className="text-xl font-black text-gray-900 tracking-tighter mt-1 uppercase">Suggested For You</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white border border-gray-50 items-center justify-center shadow-sm shadow-gray-100">
            <Ionicons name="sparkles" size={18} color="#0EA5E9" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={suggestions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      />
    </View>
  );
}
