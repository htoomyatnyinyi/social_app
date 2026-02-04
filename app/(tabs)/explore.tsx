import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSearchUsersQuery } from "../../store/authApi";
import { useSelector } from "react-redux";

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useSearchUsersQuery(search, {
    skip: !search,
  });
  const currentUser = useSelector((state: any) => state.auth.user);

  const UserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/profile/${item.id}`)}
      className="flex-row items-center p-4 border-b border-gray-50 bg-white"
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/50" }}
        className="w-12 h-12 rounded-full bg-gray-200"
      />
      <View className="ml-3 flex-1">
        <Text className="font-bold text-base text-gray-900">{item.name}</Text>
        <Text className="text-gray-500 text-sm">@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Header */}
      <View className="px-4 py-3 border-b border-gray-50">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2.5">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search Twitter"
            placeholderTextColor="#6B7280"
            className="flex-1 ml-3 text-[16px] text-gray-900"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserItem item={item} />}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 items-center justify-center mt-20 px-8">
              {!search ? (
                <>
                  <Text className="text-xl font-bold text-gray-900 mb-2">
                    Search for people
                  </Text>
                  <Text className="text-gray-500 text-center leading-5">
                    Find your friends, family, and favorite content creators.
                  </Text>
                </>
              ) : (
                <Text className="text-gray-500">
                  No users found for "{search}"
                </Text>
              )}
            </View>
          ) : (
            <View className="mt-10">
              <ActivityIndicator size="small" color="#1d9bf0" />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
