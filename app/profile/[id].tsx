import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useGetProfileQuery,
  useFollowUserMutation,
  useGetUserPostsQuery,
  useGetUserLikesQuery,
  useMuteUserMutation,
  useBlockUserMutation,
} from "../../store/profileApi";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import { useSelector } from "react-redux";
import {
  useLikePostMutation,
  useRepostPostMutation,
  useDeletePostMutation,
  useIncrementViewCountMutation,
} from "../../store/postApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const [activeTab, setActiveTab] = useState((tab as string) || "posts");

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(id);

  const {
    data: userPosts,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useGetUserPostsQuery(id, {
    skip: !id || activeTab !== "posts",
  });

  const {
    data: userLikes,
    isLoading: isLikesLoading,
    refetch: refetchLikes,
  } = useGetUserLikesQuery(id, {
    skip: !id || activeTab !== "likes",
  });

  const [followUser] = useFollowUserMutation();
  const [muteUser] = useMuteUserMutation();
  const [blockUser] = useBlockUserMutation();
  const [createChatRoom] = useCreateChatRoomMutation();
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deletePost] = useDeletePostMutation();
  const [incrementViewCount] = useIncrementViewCountMutation();

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(postId).unwrap();
          } catch (error) {
            console.error("Failed to delete post:", error);
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  };

  if (isProfileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  if (!profile)
    return <Text className="text-center mt-10">User not found</Text>;

  const isMe = user?.id === id;

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
      router.push(`/chat/${room.id}?title=${profile.name}`);
    } catch (e) {
      console.error(e);
      alert("Follow each other to start a private chat");
    }
  };

  const onRefresh = () => {
    refetchProfile();
    if (activeTab === "posts") refetchPosts();
    if (activeTab === "likes") refetchLikes();
  };

  const handleMute = async () => {
    try {
      await muteUser(id).unwrap();
      Alert.alert("Success", "User has been muted. Their posts will be hidden.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not mute user. Please try again.");
    }
  };

  const handleBlock = async () => {
    try {
      await blockUser(id).unwrap();
      Alert.alert("Blocked", "User has been completely blocked and hidden.");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not block user.");
    }
  };

  const handleMoreActions = () => {
    Alert.alert("Actions", "What would you like to do?", [
      { text: "Mute", onPress: handleMute },
      { text: "Block", onPress: handleBlock, style: "destructive" },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const PostCard = ({ item }: { item: any }) => {
    const isRepost = item.isRepost && item.originalPost;
    const displayItem = isRepost ? item.originalPost : item;

    const renderContent = (text: string) => {
      if (!text) return null;
      const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
      return (
        <Text className="text-[15px] leading-[22px] text-gray-800 mb-3">
          {parts.map((part, i) => {
            if (part.startsWith("#")) {
              return (
                <Text
                  key={i}
                  className="text-[#1D9BF0]"
                  onPress={() => router.push(`/explore?q=${encodeURIComponent(part)}`)}
                >
                  {part}
                </Text>
              );
            }
            return <Text key={i}>{part}</Text>;
          })}
        </Text>
      );
    };

    return (
      <TouchableOpacity
        onPress={() => router.push(`/post/${displayItem.id}`)}
        activeOpacity={0.9}
        className="p-4 border-b border-gray-100 bg-white"
      >
        <View className="flex-row">
          <View className="mr-3">
            <Image
              source={{
                uri:
                  displayItem.author?.image || "https://via.placeholder.com/48",
              }}
              className="w-12 h-12 rounded-full"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-0.5">
              <Text
                className="font-bold text-[15px] text-gray-900"
                numberOfLines={1}
              >
                {displayItem.author?.name || "Anonymous"}
              </Text>
              <Text className="text-gray-500 text-[14px] ml-1">
                @{displayItem.author?.name?.toLowerCase().replace(/\s/g, "")} ·{" "}
                {new Date(displayItem.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {renderContent(displayItem.content)}
            {/* Images */}
            {(() => {
              const imgs = displayItem.images?.length
                ? displayItem.images
                : displayItem.image
                  ? [displayItem.image]
                  : [];
              if (imgs.length === 0) return null;

              if (imgs.length === 1) {
                return (
                  <Image
                    source={{ uri: imgs[0] }}
                    className="w-full h-48 rounded-2xl mb-3"
                    resizeMode="cover"
                  />
                );
              }

              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3 flex-row"
                >
                  {imgs.map((uri: string, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      className="w-64 h-48 rounded-2xl border border-gray-100 bg-gray-50 mr-2"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              );
            })()}
            <View className="flex-row justify-between pr-4 mt-2">
              <TouchableOpacity className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1.5">
                  {displayItem._count?.comments || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => repostPost({ id: displayItem.id })}
              >
                <Ionicons name="repeat-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => likePost({ postId: displayItem.id })}
              >
                {(() => {
                  const hasLiked = displayItem.likes?.some(
                    (l: any) => l.userId === user?.id,
                  );
                  return (
                    <>
                      <Ionicons
                        name={hasLiked ? "heart" : "heart-outline"}
                        size={18}
                        color={hasLiked ? "#F91880" : "#6B7280"}
                      />
                      <Text
                        className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
                      >
                        {displayItem._count?.likes || 0}
                      </Text>
                    </>
                  );
                })()}
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Ionicons
                  name="stats-chart-outline"
                  size={18}
                  color="#6B7280"
                />
                <Text className="text-gray-500 text-xs ml-1.5">
                  {displayItem.views || 0}
                </Text>
              </View>
              {isMe && (
                <TouchableOpacity
                  onPress={() => handleDeletePost(displayItem.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const Header = () => (
    <SafeAreaView className="bg-white">
      {/* Header Bar */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View className="ml-6">
          <Text className="text-lg font-extrabold text-gray-900">
            {profile.name}
          </Text>
          <Text className="text-gray-500 text-xs">
            {profile._count?.posts || 0} posts
          </Text>
        </View>
        <View className="flex-1" />
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View className="h-40 bg-sky-100">
        {profile.coverImage ? (
          <Image
            source={{ uri: profile.coverImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-sky-500" />
        )}
      </View>

      {/* Profile Header */}
      <View className="px-4 -mt-12">
        <View className="flex-row justify-between items-end">
          <Image
            source={{ uri: profile.image || "https://via.placeholder.com/100" }}
            className="w-24 h-24 rounded-full border-4 border-white bg-gray-100"
          />
          {isMe ? (
            <TouchableOpacity
              onPress={() => router.push("/profile/update")}
              className="px-6 py-2 rounded-full border border-gray-300 mb-1"
            >
              <Text className="font-bold text-black">Edit profile</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row mb-1">
              <TouchableOpacity
                onPress={handleMessage}
                className="mr-2 border border-gray-300 p-2.5 rounded-full"
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
              <TouchableOpacity
                onPress={handleMoreActions}
                className="ml-2 border border-gray-300 p-2.5 rounded-full"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="black" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="mt-3">
          <Text className="text-2xl font-extrabold text-gray-900">
            {profile.name}
          </Text>
          <Text className="text-gray-500 text-[15px]">
            {/* @{profile.name.toLowerCase().replace(/\s/g, "")} */}
            {profile.username}
          </Text>
        </View>

        <Text className="mt-3 text-[16px] text-gray-800 leading-5">
          {profile.bio || "No bio yet."}
        </Text>

        <View className="flex-row flex-wrap mt-3">
          {profile.location && (
            <View className="flex-row items-center mr-4 mb-2">
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text className="text-gray-500 ml-1 text-sm">{profile.location}</Text>
            </View>
          )}
          {profile.website && (
            <View className="flex-row items-center mr-4 mb-2">
              <Ionicons name="link-outline" size={16} color="#6B7280" />
              <Text className="text-[#1d9bf0] ml-1 text-sm" numberOfLines={1}>
                {profile.website.replace(/^https?:\/\//, "")}
              </Text>
            </View>
          )}
          <View className="flex-row items-center mr-4 mb-2">
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 ml-1 text-sm">
              Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
          </View>
          {profile.dob && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="gift-outline" size={16} color="#6B7280" />
              <Text className="text-gray-500 ml-1 text-sm">
                Born {new Date(profile.dob).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row mt-4 mb-6">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/following",
                params: { userId: profile.id },
              })
            }
            className="flex-row mr-5"
          >
            <Text className="font-bold text-gray-900">
              {profile._count?.following || 0}
            </Text>
            <Text className="text-gray-500 ml-1">Following</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/followers",
                params: { userId: profile.id },
              })
            }
            className="flex-row"
          >
            <Text className="font-bold text-gray-900">
              {profile._count?.followers || 0}
            </Text>
            <Text className="text-gray-500 ml-1">Followers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100">
        <TouchableOpacity
          onPress={() => setActiveTab("posts")}
          className={`flex-1 items-center py-4 ${activeTab === "posts" ? "border-b-4 border-[#1d9bf0]" : ""}`}
        >
          <Text
            className={`font-bold text-[15px] ${activeTab === "posts" ? "text-gray-900" : "text-gray-500"}`}
          >
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("replies")}
          className={`flex-1 items-center py-4 ${activeTab === "replies" ? "border-b-4 border-[#1d9bf0]" : ""}`}
        >
          <Text
            className={`font-bold text-[15px] ${activeTab === "replies" ? "text-gray-900" : "text-gray-500"}`}
          >
            Replies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("likes")}
          className={`flex-1 items-center py-4 ${activeTab === "likes" ? "border-b-4 border-[#1d9bf0]" : ""}`}
        >
          <Text
            className={`font-bold text-[15px] ${activeTab === "likes" ? "text-gray-900" : "text-gray-500"}`}
          >
            Likes
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const data =
    activeTab === "posts" ? userPosts : activeTab === "likes" ? userLikes : [];
  // console.log(data, "profile data ");
  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={data}
        ListHeaderComponent={Header}
        renderItem={({ item }) => <PostCard item={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isProfileLoading || isPostsLoading || isLikesLoading}
            onRefresh={onRefresh}
            tintColor="#1d9bf0"
          />
        }
        // ListEmptyComponent={
        //   !isProfileLoading &&
        //   !isPostsLoading && (
        //     <View className="items-center py-10 opacity-50">
        //       <Text className="text-lg font-bold">No {activeTab} yet</Text>
        //     </View>
        //   )
        // }
        ListEmptyComponent={
          <View className="items-center py-10 opacity-50">
            <Text className="text-lg font-bold">No {activeTab} yet</Text>
          </View>
        }
      />
    </View>
  );
}
