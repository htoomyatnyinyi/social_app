import React from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useGetProfileQuery,
  useFollowUserMutation,
} from "../../store/profileApi";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import { useSelector } from "react-redux";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useSelector((state: any) => state.auth.user);

  const { data: profile, isLoading } = useGetProfileQuery(id);
  const [followUser] = useFollowUserMutation();
  const [createChatRoom] = useCreateChatRoomMutation();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  if (!profile)
    return <Text className="text-center mt-10">User not found</Text>;

  const isMe = currentUser?.id === id;

  const handleFollow = async () => {
    try {
      await followUser(id).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessage = async () => {
    try {
      const room = await createChatRoom(id as string).unwrap();
      router.push(`/chat/${room.id}`);
    } catch (e) {
      console.error(e);
      alert("Follow required to start a chat");
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View className="ml-8">
          <Text className="text-lg font-bold">{profile.name}</Text>
          <Text className="text-gray-500 text-xs">
            {profile._count?.posts || 0} posts
          </Text>
        </View>
      </View>

      {/* Banner */}
      <View className="h-32 bg-gray-200" />

      {/* Profile Header */}
      <View className="px-4 -mt-12">
        <View className="flex-row justify-between items-end">
          <Image
            source={{ uri: profile.image || "https://via.placeholder.com/100" }}
            className="w-24 h-24 rounded-full border-4 border-white"
          />
          {!isMe && (
            <View className="flex-row mb-1">
              <TouchableOpacity
                onPress={handleMessage}
                className="mr-2 border border-gray-300 p-2 rounded-full"
              >
                <Ionicons name="mail-outline" size={20} color="black" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFollow}
                className={`px-6 py-2 rounded-full ${profile.isFollowing ? "border border-gray-300" : "bg-black"}`}
              >
                <Text
                  className={`font-bold ${profile.isFollowing ? "text-black" : "text-white"}`}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mt-2">
          <Text className="text-xl font-bold">{profile.name}</Text>
          <Text className="text-gray-500">@{profile.email?.split("@")[0]}</Text>
        </View>

        <Text className="mt-3 text-[15px]">{profile.bio || "No bio yet."}</Text>

        <View className="flex-row mt-3 mb-4">
          <View className="flex-row mr-4">
            <Text className="font-bold">{profile._count?.following || 0}</Text>
            <Text className="text-gray-500 ml-1">Following</Text>
          </View>
          <View className="flex-row">
            <Text className="font-bold">{profile._count?.followers || 0}</Text>
            <Text className="text-gray-500 ml-1">Followers</Text>
          </View>
        </View>
      </View>

      <View className="flex-row border-b border-gray-100">
        <TouchableOpacity className="flex-1 items-center py-3 border-b-4 border-sky-500">
          <Text className="font-bold">Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 items-center py-3">
          <Text className="text-gray-500 font-bold">Replies</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
