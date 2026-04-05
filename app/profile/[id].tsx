import React, { useState, useCallback } from "react";
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
  useGetUserRepliesQuery,
  useMuteUserMutation,
  useBlockUserMutation,
} from "../../store/profileApi";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import { useSelector } from "react-redux";
import {
  useLikePostMutation,
  useRepostPostMutation,
  useDeletePostMutation,
  useBookmarkPostMutation,
} from "../../store/postApi";
import { SafeAreaView } from "react-native-safe-area-context";
import PostCard, { Post } from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";

export default function UserProfileScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    (tab as any) || "posts"
  );
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(id as string, { skip: !id });

  const {
    data: postData,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useGetUserPostsQuery(id as string, {
    skip: !id || activeTab !== "posts",
  });

  const {
    data: likeData,
    isLoading: isLikesLoading,
    refetch: refetchLikes,
  } = useGetUserLikesQuery(id as string, {
    skip: !id || activeTab !== "likes",
  });

  const { data: replyData, isLoading: isRepliesLoading } =
    useGetUserRepliesQuery(id as string, {
      skip: !id || activeTab !== "replies",
    });

  const [followUser] = useFollowUserMutation();
  const [muteUser] = useMuteUserMutation();
  const [blockUser] = useBlockUserMutation();
  const [createChatRoom] = useCreateChatRoomMutation();
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deletePost] = useDeletePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();

  const handleLike = useCallback(
    async (postId: string) => {
      try {
        await likePost({ postId }).unwrap();
      } catch (err) {
        console.error("Like failed", err);
      }
    },
    [likePost]
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
      try {
        await bookmarkPost(postId).unwrap();
      } catch (err) {
        console.error("Bookmark failed", err);
      }
    },
    [bookmarkPost]
  );

  const handleRepostAction = useCallback(
    (post: Post) => {
      repostPost({ id: post.id });
    },
    [repostPost]
  );

  if (isProfileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  if (!profile)
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500 font-medium">User not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-black rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  const isMe = user?.id === id;

  const handleFollow = async () => {
    try {
      await followUser(id as string).unwrap();
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
      await muteUser(id as string).unwrap();
      Alert.alert("Success", "User has been muted. Their posts will be hidden.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not mute user. Please try again.");
    }
  };

  const handleBlock = async () => {
    try {
      await blockUser(id as string).unwrap();
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

  const Header = () => (
    <SafeAreaView className="bg-white" edges={["top"]}>
      {/* Header Bar */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View className="ml-6 flex-1">
          <Text className="text-lg font-extrabold text-gray-900" numberOfLines={1}>
            {profile.name}
          </Text>
          <Text className="text-gray-500 text-xs">
            {profile._count?.posts || 0} posts
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={22} color="#111827" />
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
        {(["posts", "replies", "likes"] as const).map((tabName) => (
          <TouchableOpacity
            key={tabName}
            onPress={() => setActiveTab(tabName)}
            className={`flex-1 items-center py-4 ${activeTab === tabName ? "border-b-4 border-[#1d9bf0]" : ""}`}
          >
            <Text
              className={`font-bold text-[15px] ${activeTab === tabName ? "text-gray-900" : "text-gray-500"}`}
            >
              {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );

  const posts =
    activeTab === "posts"
      ? postData?.posts
      : activeTab === "likes"
        ? likeData?.posts
        : activeTab === "replies"
          ? replyData?.posts
          : [];

  const isLoading =
    isProfileLoading ||
    (activeTab === "posts" && isPostsLoading) ||
    (activeTab === "likes" && isLikesLoading) ||
    (activeTab === "replies" && isRepliesLoading);

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={posts}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <PostCard 
            item={item} 
            user={user}
            onPressPost={(id) => router.push(`/post/${id}`)}
            onPressProfile={(id) => id !== profile?.id && router.push(`/profile/${id}`)}
            onPressOptions={(p) => {
              setPostForOptions(p);
              setOptionsModalVisible(true);
            }}
            onPressComment={(id) => router.push(`/post/${id}`)}
            onPressRepost={handleRepostAction}
            onLike={handleLike}
            onBookmark={handleBookmark}
          />
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#1d9bf0"
          />
        }
        ListEmptyComponent={
          <View className="items-center py-10 opacity-50">
            <Text className="text-lg font-bold">No {activeTab} yet</Text>
          </View>
        }
      />

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === user?.id}
        onDelete={async () => {
          if (!postForOptions?.id) return;
          try {
            await deletePost({ id: postForOptions.id }).unwrap();
            setOptionsModalVisible(false);
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
      />
    </View>
  );
}
