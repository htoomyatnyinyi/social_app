import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import { useRouter } from "expo-router";
import {
  useGetProfileQuery,
  useGetUserPostsQuery,
  useGetUserLikesQuery,
  useGetUserRepliesQuery,
} from "../../store/profileApi";
import {
  useLikePostMutation,
  useRepostPostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
} from "../../store/postApi";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import PostCard, { Post } from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    "posts",
  );
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(user?.id, { skip: !user?.id });

  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [deletePost] = useDeletePostMutation();

  const {
    data: postData,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useGetUserPostsQuery(user?.id, {
    skip: !user?.id || activeTab !== "posts",
  });

  const {
    data: likeData,
    isLoading: isLikesLoading,
    refetch: refetchLikes,
  } = useGetUserLikesQuery(user?.id, {
    skip: !user?.id || activeTab !== "likes",
  });

  const {
    data: replyData,
    isLoading: isRepliesLoading,
    refetch: refetchReplies,
  } = useGetUserRepliesQuery(user?.id, {
    skip: !user?.id || activeTab !== "replies",
  });

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    dispatch(logout());
    router.replace("/auth");
  };

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchProfile();
    if (activeTab === "posts") refetchPosts();
    if (activeTab === "likes") refetchLikes();
    if (activeTab === "replies") refetchReplies();
  };

  const currentData = useMemo(() => {
    if (activeTab === "posts") return postData?.posts || [];
    if (activeTab === "likes") return likeData?.posts || [];
    if (activeTab === "replies") return replyData?.posts || [];
    return [];
  }, [activeTab, postData, likeData, replyData]);

  const isLoading =
    isProfileLoading ||
    (activeTab === "posts" && isPostsLoading) ||
    (activeTab === "likes" && isLikesLoading) ||
    (activeTab === "replies" && isRepliesLoading);

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

  const handleRepostAction = useCallback(
    (post: Post) => {
      repostPost({ id: post.id });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [repostPost],
  );

  const Header = () => (
    <View className="bg-[#F8FAFC]">
      {/* Premium Banner */}
      <View className="h-44 bg-sky-100 overflow-hidden">
        {profile?.coverImage ? (
          <Image
            source={{ uri: profile.coverImage }}
            className="w-full h-full"
            // contentMode="cover"
            contentFit="cover"
            transition={500}
          />
        ) : (
          <LinearGradient
            colors={["#0EA5E9", "#38BDF8", "#7DD3FC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-full"
          />
        )}
        {/* Subtle Overlay to make back button/icons visible if added later */}
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "transparent"]}
          className="absolute top-0 left-0 right-0 h-16"
        />
      </View>

      {/* Profile Info Overlay Card */}
      <View className="px-5 -mt-16 pb-6">
        <View className="flex-row justify-between items-end">
          <View className="relative shadow-2xl shadow-sky-400">
            <Image
              source={{
                uri:
                  profile?.image ||
                  user?.image ||
                  "https://api.dicebear.com/7.x/avataaars/png?seed=user",
              }}
              className="w-28 h-28 rounded-[40px] border-4 border-white bg-white"
              // contentMode="cover"
              contentFit="cover"
              transition={300}
            />
            {/* Online Status Indicator */}
            <View className="absolute bottom-1 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white" />
          </View>

          <View className="flex-row items-center mb-1 space-x-2">
            <TouchableOpacity
              onPress={() => router.push("/profile/update")}
              className="bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm"
            >
              <Text className="font-black text-gray-900 text-[13px] uppercase tracking-wider">
                Edit profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="bg-white w-11 h-11 border border-gray-100 items-center justify-center rounded-2xl shadow-sm"
            >
              <Ionicons name="settings-outline" size={20} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="bg-rose-50 w-11 h-11 border border-rose-100 items-center justify-center rounded-2xl"
            >
              <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row items-center">
            <Text className="text-3xl font-black text-gray-900 tracking-tighter mr-1">
              {profile?.name || user?.name || "Member"}
            </Text>
            {profile?.isVerified && (
              <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" />
            )}
          </View>
          <Text className="text-sky-600 font-bold text-[15px] -mt-1">
            @{profile?.username || user?.username || "handle"}
          </Text>
        </View>

        <Text className="mt-4 text-[16px] text-gray-600 font-medium leading-[22px]">
          {profile?.bio || "Finding my rhythm in the oasis of mindfulness. ✨"}
        </Text>

        <View className="flex-row flex-wrap mt-4">
          {profile?.location && (
            <BlurView
              intensity={30}
              tint="light"
              className="flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border border-white/50 bg-white/20"
            >
              <Ionicons name="location" size={14} color="#64748B" />
              <Text className="text-gray-500 ml-1.5 text-[13px] font-bold">
                {profile.location}
              </Text>
            </BlurView>
          )}
          <View className="flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border border-white/50 bg-white/20">
            <Ionicons name="calendar" size={14} color="#64748B" />
            <Text className="text-gray-500 ml-1.5 text-[13px] font-bold">
              Joined{" "}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                  })
                : "2026"}
            </Text>
          </View>
        </View>

        {/* Following & Followers Premium Section */}
        <View className="flex-row mt-4 space-x-6">
          <TouchableOpacity
            className="flex-row items-baseline"
            onPress={() =>
              router.push({
                pathname: "/profile/following",
                params: { userId: user?.id },
              })
            }
          >
            <Text className="text-xl font-black text-gray-900">
              {profile?._count?.following || 0}
            </Text>
            <Text className="text-gray-400 font-bold ml-1 text-xs uppercase tracking-widest">
              Following
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-baseline"
            onPress={() =>
              router.push({
                pathname: "/profile/followers",
                params: { userId: user?.id },
              })
            }
          >
            <Text className="text-xl font-black text-gray-900">
              {profile?._count?.followers || 0}
            </Text>
            <Text className="text-gray-400 font-bold ml-1 text-xs uppercase tracking-widest">
              Followers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Glassy Sticky Tab Hub */}
      <View className="bg-[#F8FAFC]">
        <View className="flex-row px-5 py-2">
          {(["posts", "replies", "likes"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              className="flex-1 items-center"
            >
              <View
                className={`px-4 py-2.5 rounded-2xl ${activeTab === tab ? "bg-white shadow-sm border border-gray-100" : ""}`}
              >
                <Text
                  className={`font-black text-[13px] uppercase tracking-widest ${
                    activeTab === tab ? "text-sky-500" : "text-gray-400"
                  }`}
                >
                  {tab}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-[1px] bg-gray-100 mx-5" />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <FlatList
        data={currentData}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View className="px-5 mt-4">
            <PostCard
              item={item}
              user={user}
              onPressPost={(id) => router.push(`/post/${id}`)}
              onPressProfile={(id) =>
                id !== user?.id && router.push(`/profile/${id}`)
              }
              onPressOptions={(p) => {
                setPostForOptions(p);
                setOptionsModalVisible(true);
              }}
              onPressComment={(id) => router.push(`/post/${id}`)}
              onPressRepost={handleRepostAction}
              onLike={handleLike}
              onBookmark={handleBookmark}
            />
          </View>
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#0EA5E9"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-20 px-10">
            <View className="w-16 h-16 bg-gray-100 rounded-3xl items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={32} color="#94A3B8" />
            </View>
            <Text className="text-xl font-black text-gray-900 tracking-tight text-center uppercase">
              No {activeTab} yet
            </Text>
            <Text className="text-gray-400 text-center mt-2 font-medium leading-5">
              Your {activeTab} will weave the social fabric of the oasis.
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
