import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";
import PostCard, { Post } from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import {
  useBookmarkPostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useRepostPostMutation,
} from "../../store/postApi";
import {
  useBlockUserMutation,
  useFollowUserMutation,
  useGetProfileQuery,
  useGetUserLikesQuery,
  useGetUserPostsQuery,
  useGetUserRepliesQuery,
  useMuteUserMutation,
} from "../../store/profileApi";

export default function UserProfileScreen() {
  const { id, tab, title: searchTitle } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const user = useSelector((state: any) => state.auth.user);

  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    (tab as any) || "posts",
  );
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(id as string, { skip: !id });

  const { data: postData, refetch: refetchPosts } = useGetUserPostsQuery(
    { id: id as string },
    {
      skip: !id || activeTab !== "posts",
    },
  );

  const { data: likeData, refetch: refetchLikes } = useGetUserLikesQuery(
    { id: id as string },
    {
      skip: !id || activeTab !== "likes",
    },
  );

  const { data: replyData, refetch: refetchReplies } = useGetUserRepliesQuery({ id: id as string }, {
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
    [likePost],
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
      try {
        await bookmarkPost(postId).unwrap();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (err) {
        console.error("Bookmark failed", err);
      }
    },
    [bookmarkPost],
  );

  const handleRepostAction = useCallback(async (post: Post) => {
    try {
      await repostPost({ id: post.id }).unwrap();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error("Repost failed", err);
    }
  }, [repostPost]);

  const handlePressPost = useCallback((id: string) => {
    router.push(`/post/${id}`);
  }, [router]);

  const handlePressProfile = useCallback((authorId: string) => {
    if (authorId !== profile?.id) {
      router.push(`/profile/${authorId}`);
    }
  }, [router, profile?.id]);

  const handlePressOptions = useCallback((p: Post) => {
    setPostForOptions(p);
    setOptionsModalVisible(true);
  }, []);

  const handleFollow = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await followUser(id as string).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const room = await createChatRoom(id as string).unwrap();
      router.push(`/chat/${room.id}?title=${profile.name}`);
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Chat",
        "Follow each other to start a conversation.",
      );
    }
  };

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchProfile();
    if (activeTab === "posts") refetchPosts();
    if (activeTab === "likes") refetchLikes();
    if (activeTab === "replies") refetchReplies();
  };

  const currentData = useMemo(() => {
    const posts = postData?.posts || [];
    const likes = likeData?.posts || [];
    const replies = replyData?.posts || [];

    if (activeTab === "posts") {
      return posts.filter((post: any) => {
        const isActuallyAReply =
          !!post.parentPost ||
          !!post.parentId ||
          !!post.replyToId ||
          !!post.parent ||
          post.type === "REPLY";
        return !isActuallyAReply;
      });
    }

    if (activeTab === "likes") return likes;

    if (activeTab === "replies") {
      return replies.filter((post: any) => {
        const isActuallyAReply =
          !!post.parentPost ||
          !!post.parentId ||
          !!post.replyToId ||
          !!post.parent ||
          post.type === "REPLY";
        return isActuallyAReply;
      });
    }
    return [];
  }, [activeTab, postData, likeData, replyData]);

  if (isProfileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] items-center justify-center px-10">
        <View className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-3xl items-center justify-center mb-6">
          <Ionicons name="person-outline" size={40} color="#94A3B8" />
        </View>
        <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter text-center uppercase">
          User Not Found
        </Text>
        <Text className="text-gray-400 dark:text-slate-400 text-center mt-2 font-medium">
          The user you are looking for does not exist or has been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 px-8 py-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-200 dark:shadow-none"
        >
          <Text className="text-white font-black uppercase tracking-widest text-xs">
            Return Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMe = user?.id === id;

  const handleMoreActions = () => {
    Alert.alert(
      "Privacy Actions",
      "Choose how you interact with this member.",
      [
        {
          text: "Mute Member",
          onPress: async () => {
            await muteUser(id as string).unwrap();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              "User Muted",
              "You won't see their posts in your feed anymore.",
            );
          },
        },
        {
          text: "Block Member",
          onPress: async () => {
            await blockUser(id as string).unwrap();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
          style: "destructive",
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const Header = () => (
    <View className="bg-[#F8FAFC] dark:bg-[#0F172A]">
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        className="absolute top-0 left-0 right-0 z-50 flex-row items-center px-5 py-4 border-b border-gray-100/50 dark:border-slate-800/50"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none"
        >
          <Ionicons name="chevron-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <View className="ml-4 flex-1">
          <Text
            className="text-lg font-black pt-2 text-gray-900 dark:text-white tracking-tighter"
            numberOfLines={1}
          >
            {profile.name}
          </Text>
          <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">
            {profile._count?.posts || 0} Posts
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          className="w-10 h-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
        </TouchableOpacity>
      </BlurView>

      <View className="h-56 bg-sky-100 dark:bg-sky-900/30">
        {profile.coverImage ? (
          <Image
            source={{ uri: profile.coverImage }}
            className="w-full h-full"
            contentFit="cover"
            transition={500}
          />
        ) : (
          <LinearGradient
            colors={["#0EA5E9", "#38BDF8", "#7DD3FC"]}
            className="w-full h-full opacity-100 dark:opacity-80"
          />
        )}
      </View>

      <View className="px-5 -mt-20 pb-6">
        <View className="flex-row justify-between items-end">
          <View className="shadow-2xl shadow-sky-400 dark:shadow-none">
            <Image
              source={{
                uri:
                  profile.image ||
                  "https://api.dicebear.com/7.x/avataaars/png?seed=" +
                  profile.username,
              }}
              className="w-32 h-32 rounded-[44px] border-4 border-white dark:border-[#0F172A] bg-white dark:bg-slate-800"
              contentFit="cover"
              transition={300}
            />
          </View>

          <View className="flex-row mb-1 space-x-2">
            {!isMe && (
              <>
                <TouchableOpacity
                  onPress={handleMessage}
                  className="bg-white dark:bg-slate-800 w-12 h-12 border mr-3 border-gray-100 dark:border-slate-700 items-center justify-center rounded-2xl shadow-sm dark:shadow-none"
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#0EA5E9"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFollow}
                  className={`px-8 py-3 rounded-2xl mr-3 shadow-sm ${profile.isFollowing ? "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700" : "bg-sky-500 shadow-sky-200 dark:shadow-none"}`}
                >
                  <Text
                    className={`font-black uppercase tracking-wider text-xs ${profile.isFollowing ? "text-gray-400 dark:text-slate-400" : "text-white"}`}
                  >
                    {profile.isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleMoreActions}
                  className="bg-rose-50 dark:bg-rose-500/10 w-12 h-12 border border-rose-100 dark:border-rose-500/20 items-center justify-center rounded-2xl"
                >
                  <Ionicons name="shield-outline" size={20} color="#F43F5E" />
                </TouchableOpacity>
              </>
            )}
            {isMe && (
              <TouchableOpacity
                onPress={() => router.push("/profile/update")}
                className="bg-white dark:bg-slate-800 px-8 py-3 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none"
              >
                <Text className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                  Edit Profile
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="mt-5">
          <View className="flex-row items-center">
            <Text className="text-3xl font-black pt-5 text-gray-900 dark:text-white tracking-tighter mr-1">
              {profile.name}
            </Text>
            {profile.isVerified && (
              <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
            )}
          </View>
          <Text className="text-sky-600 font-bold text-[16px] -mt-1">
            @{profile.username}
          </Text>
        </View>

        <Text className="mt-4 text-[16px] text-gray-700 dark:text-slate-300 font-medium leading-6">
          {profile.bio || "Crafting moments on the platform. ✨"}
        </Text>

        <View className="flex-row flex-wrap mt-5">
          {profile.location && (
            <View className="flex-row items-center mr-4 mb-2 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-slate-700">
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text className="text-gray-500 ml-1.5 text-xs font-bold">
                {profile.location}
              </Text>
            </View>
          )}
          <View className="flex-row items-center mr-4 mb-2 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-slate-700">
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text className="text-gray-500 ml-1.5 text-xs font-bold">
              Joined{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View className="flex-row mt-6 space-x-8">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/following",
                params: { userId: profile.id },
              })
            }
            className="flex-row items-baseline"
          >
            <Text className="text-2xl font-black text-gray-900 dark:text-white">
              {profile._count?.following || 0}
            </Text>
            <Text className="text-gray-400 dark:text-slate-500 ml-1 font-bold text-xs uppercase tracking-widest">
              Following
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/followers",
                params: { userId: profile.id },
              })
            }
            className="flex-row items-baseline"
          >
            <Text className="text-2xl font-black text-gray-900 dark:text-white">
              {profile._count?.followers || 0}
            </Text>
            <Text className="text-gray-400 dark:text-slate-500 ml-1 font-bold text-xs uppercase tracking-widest">
              Followers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 py-2">
        <View className="flex-row bg-gray-100/50 dark:bg-slate-800/50 rounded-2xl p-1">
          {(["posts", "replies", "likes"] as const).map((tabName) => (
            <TouchableOpacity
              key={tabName}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tabName);
              }}
              className={`flex-1 items-center py-2.5 rounded-xl ${activeTab === tabName ? "bg-white dark:bg-slate-700 shadow-sm dark:shadow-none" : ""}`}
            >
              <Text
                className={`font-black text-[12px] uppercase tracking-widest ${activeTab === tabName ? "text-[#0EA5E9]" : "text-gray-400 dark:text-slate-500"}`}
              >
                {tabName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <FlatList
        data={currentData}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View className="px-5 mt-4">
            <PostCard
              item={item}
              user={user}
              onPressPost={handlePressPost}
              onPressProfile={handlePressProfile}
              onPressOptions={handlePressOptions}
              onPressComment={handlePressPost}
              onPressRepost={handleRepostAction}
              onLike={handleLike}
              onBookmark={handleBookmark}
            />
          </View>
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={isProfileLoading}
            onRefresh={onRefresh}
            tintColor="#0EA5E9"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <View className="items-center py-20 px-10">
            <View className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-3xl items-center justify-center mb-4">
              <Ionicons name="layers-outline" size={32} color="#94A3B8" />
            </View>
            <Text className="text-lg font-black text-gray-900 dark:text-white tracking-tight text-center uppercase">
              No {activeTab} yet
            </Text>
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
      />
    </View>
  );
}
