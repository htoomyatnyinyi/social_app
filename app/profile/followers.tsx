import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGetFollowersQuery } from "../../store/profileApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const { data: followers, isLoading } = useGetFollowersQuery(userId);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/profile/${item.id}`)}
      className="flex-row items-center p-4 border-b border-gray-100"
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/50" }}
        className="w-12 h-12 rounded-full bg-gray-200"
      />
      <View className="ml-3 flex-1">
        <Text className="font-bold text-base text-gray-900">{item.name}</Text>
        <Text className="text-gray-500 text-sm">@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Followers</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1d9bf0" />
        </View>
      ) : (
        <FlatList
          data={followers || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Text className="text-gray-500">No followers yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
