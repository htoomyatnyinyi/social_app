import React from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetBookmarksQuery } from "@/store/postApi";

export default function BookmarksScreen() {
  const router = useRouter();
  const {
    data: bookmarks,
    isLoading,
    refetch,
    isFetching,
  } = useGetBookmarksQuery({});

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/post/${item.id}`)}
      activeOpacity={0.9}
      className="p-4 border-b border-gray-100 bg-white"
    >
      <View className="flex-row">
        <View className="mr-3">
          <Image
            source={{
              uri: item.author?.image || "https://via.placeholder.com/48",
            }}
            className="w-12 h-12 rounded-full bg-gray-100"
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-0.5">
            <Text
              className="font-bold text-[15px] text-gray-900"
              numberOfLines={1}
            >
              {item.author?.name || "Anonymous"}
            </Text>
            <Text className="text-gray-500 text-[14px] ml-1">
              @{item.author?.username} ·{" "}
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text className="text-[15px] leading-[22px] text-gray-800 mb-2">
            {item.content}
          </Text>
          {item.image && (
            <Image
              source={{ uri: item.image }}
              className="w-full h-56 rounded-2xl mb-2 border border-gray-100"
              resizeMode="cover"
            />
          )}
          {/* Simple stats row for now */}
          <View className="flex-row justify-between pr-10 mt-2">
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1.5">
                {item._count?.comments || 0}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="repeat-outline" size={18} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1.5">
                {item._count?.reposts || 0}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={18} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1.5">
                {item._count?.likes || 0}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="bookmark" size={18} color="#1d9bf0" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-extrabold text-gray-900">
            Bookmarks
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1d9bf0" />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#1d9bf0"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20 px-10">
              <Text className="text-lg font-bold text-gray-900 mb-2">
                Save posts for later
              </Text>
              <Text className="text-gray-500 text-center">
                Do not let the good ones fly away! Bookmark posts to easily find
                them again in the future.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
