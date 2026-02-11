import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useGetSuggestionsQuery,
  useFollowUserMutation,
} from "../store/profileApi";
import { useSelector } from "react-redux";

interface User {
  id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
}

export default function FollowerSuggestions() {
  const router = useRouter();
  const { data: suggestions, isLoading, refetch } = useGetSuggestionsQuery({});
  const [followUser] = useFollowUserMutation();
  const currentUser = useSelector((state: any) => state.auth.user);

  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId).unwrap();
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <View className="mr-4 w-36 bg-white rounded-xl border border-gray-200 p-3 items-center shadow-sm">
      <TouchableOpacity
        onPress={() => router.push(`/profile/${item.id}`)}
        className="items-center mb-2"
      >
        <Image
          source={{
            uri: item.image || "https://via.placeholder.com/60",
          }}
          className="w-16 h-16 rounded-full mb-2 bg-gray-100"
        />
        <Text
          numberOfLines={1}
          className="text-gray-900 font-bold text-sm text-center"
        >
          {item.name}
        </Text>
        <Text numberOfLines={1} className="text-gray-500 text-xs text-center">
          @{item.username}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-black py-1.5 px-4 rounded-full w-full mt-1"
        onPress={() => handleFollow(item.id)}
      >
        <Text className="text-white text-xs font-bold text-center">Follow</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="h-48 items-center justify-center">
        <ActivityIndicator color="#1d9bf0" />
      </View>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View className="py-4 border-b border-gray-100 bg-gray-50/50">
      <View className="px-4 mb-3 flex-row justify-between items-center">
        <Text className="text-lg font-bold text-gray-900">
          Suggested for you
        </Text>
      </View>
      <FlatList
        data={suggestions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}
