import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGetFollowersQuery, useFollowUserMutation } from "../../store/profileApi";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: followers, isLoading, refetch } = useGetFollowersQuery(userId);
  const [followUser] = useFollowUserMutation();

  const handleFollow = async (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await followUser(id).unwrap();
    } catch (e) {
      console.error("Failed to toggle follow", e);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/profile/${item.id}`)}
      className="flex-row items-center px-5 py-4 bg-white border-b border-gray-50 mb-1"
    >
      <Image
        source={{ uri: item.image || "https://api.dicebear.com/7.x/avataaars/png?seed=" + item.username }}
        className="w-14 h-14 rounded-2xl bg-gray-100"
        contentMode="cover"
        transition={300}
      />
      <View className="ml-4 flex-1">
        <Text className="font-black text-[16px] text-gray-900 tracking-tight">{item.name}</Text>
        <Text className="text-sky-500 font-bold text-xs uppercase tracking-widest mt-0.5">@{item.username}</Text>
      </View>
      <TouchableOpacity
        className={`py-2 px-6 rounded-2xl shadow-sm ${
          item.isFollowing ? "bg-white border border-gray-100" : "bg-sky-500 shadow-sky-200"
        }`}
        onPress={() => handleFollow(item.id)}
      >
        <Text
          className={`text-[10px] font-black uppercase tracking-wider ${
            item.isFollowing ? "text-gray-400" : "text-white"
          }`}
        >
          {item.isFollowing ? "Bound" : "Connect"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Header */}
      <BlurView intensity={80} tint="light" className="flex-row items-center px-5 py-4 border-b border-gray-100/50" style={{ paddingTop: insets.top }}>
        <TouchableOpacity 
           onPress={() => router.back()} 
           className="w-10 h-10 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm"
        >
          <Ionicons name="chevron-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <Text className="text-xl font-black ml-4 text-gray-900 tracking-tighter uppercase">Followers</Text>
      </BlurView>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={followers || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-20 px-10">
              <View className="w-16 h-16 bg-gray-100 rounded-3xl items-center justify-center mb-4">
                 <Ionicons name="people-outline" size={32} color="#94A3B8" />
              </View>
              <Text className="text-xl font-black text-gray-900 tracking-tight text-center uppercase">Solitary Spirit</Text>
              <Text className="text-gray-400 text-center mt-2 font-medium">No one has joined this sanctuary yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
