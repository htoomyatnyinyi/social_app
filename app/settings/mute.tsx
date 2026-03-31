import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMutedUsersQuery, useMuteUserMutation } from "../../store/profileApi";

export default function MutedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: mutedUsers, isLoading, refetch } = useGetMutedUsersQuery({});
  const [unmuteUser] = useMuteUserMutation();

  const handleUnmute = async (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await unmuteUser(id).unwrap();
      refetch();
    } catch (e) {
      console.error("Failed to unmute user", e);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center px-5 py-4 bg-white border-b border-gray-50 mb-1">
      <TouchableOpacity
        onPress={() => router.push(`/profile/${item.id}`)}
        className="flex-row items-center flex-1"
      >
        <Image
          source={{ uri: item.image || "https://api.dicebear.com/7.x/avataaars/png?seed=" + item.username }}
          className="w-14 h-14 rounded-2xl bg-gray-100"
          contentFit="cover"
          transition={300}
        />
        <View className="ml-4 flex-1">
          <Text className="font-black text-[16px] text-gray-900 tracking-tight">{item.name}</Text>
          <Text className="text-emerald-500 font-bold text-xs uppercase tracking-widest mt-0.5">@{item.username}</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => handleUnmute(item.id)}
        className="bg-emerald-50 border border-emerald-100 px-6 py-2 rounded-2xl"
      >
        <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-wider">Unmute</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <BlurView intensity={80} tint="light" className="flex-row items-center px-5 py-4 border-b border-gray-100/50" style={{ paddingTop: insets.top }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm"
        >
          <Ionicons name="chevron-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <Text className="text-xl font-black ml-4 text-gray-900 tracking-tighter uppercase">Muted Presence</Text>
      </BlurView>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={mutedUsers || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-20 px-10">
              <View className="w-16 h-16 bg-gray-100 rounded-3xl items-center justify-center mb-4">
                <Ionicons name="volume-mute-outline" size={32} color="#94A3B8" />
              </View>
              <Text className="text-xl font-black text-gray-900 tracking-tight text-center uppercase">Total stillness</Text>
              <Text className="text-gray-400 text-center mt-2 font-medium">You haven't silenced any souls in the oasis.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
