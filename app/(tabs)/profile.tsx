import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import PostCard, { Post } from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import RepostModal from "../../components/RepostModal";
import { logout } from "../../store/authSlice";
import {
  useBookmarkPostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useRepostPostMutation,
} from "../../store/postApi";
import {
  useGetProfileQuery,
  useGetUserLikesQuery,
  useGetUserPostsQuery,
  useGetUserRepliesQuery,
} from "../../store/profileApi";

export default function ProfileScreen() {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    "posts",
  );
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [repostModalVisible, setRepostModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);
  const [postForRepost, setPostForRepost] = useState<Post | null>(null);

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
  } = useGetUserPostsQuery(
    { id: user?.id },
    {
      skip: !user?.id || activeTab !== "posts",
    },
  );

  const {
    data: likeData,
    isLoading: isLikesLoading,
    refetch: refetchLikes,
  } = useGetUserLikesQuery(
    { id: user?.id },
    {
      skip: !user?.id || activeTab !== "likes",
    },
  );

  const {
    data: replyData,
    isLoading: isRepliesLoading,
    refetch: refetchReplies,
  } = useGetUserRepliesQuery(
    { id: user?.id },
    {
      skip: !user?.id || activeTab !== "replies",
    },
  );

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.replace("/auth");
    setTimeout(() => dispatch(logout()), 100);
  };

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchProfile();
    if (activeTab === "posts") refetchPosts();
    if (activeTab === "likes") refetchLikes();
    if (activeTab === "replies") refetchReplies();
  };

  /**
   * FIX LOGIC HERE:
   * We ensure that "posts" ONLY contains items where parentPost AND parentId are null.
   * We ensure "replies" ONLY contains items where parentPost OR parentId exists.
   */

  const currentData = useMemo(() => {
    const posts = postData?.posts || [];
    const likes = likeData?.posts || [];
    const replies = replyData?.posts || [];

    if (activeTab === "posts") {
      return posts.filter((post: any) => {
        // This checks every possible way a post might be flagged as a reply
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

  const handleRepostAction = useCallback((post: Post) => {
    setPostForRepost(post);
    setRepostModalVisible(true);
  }, []);

  const onDirectRepost = useCallback(async () => {
    if (!postForRepost) return;
    try {
      await repostPost({ id: postForRepost.id }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Repost failed", err);
    }
  }, [postForRepost, repostPost]);

  const onQuote = useCallback(() => {
    if (!postForRepost) return;
    router.push({
      pathname: "/compose/post",
      params: {
        quoteId: postForRepost.id,
        quoteContent: postForRepost.content,
        quoteAuthor: postForRepost.author?.name || "Member",
      },
    });
  }, [postForRepost]);

  const Header = () => (
    <View className={isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}>
      <View className="h-44 bg-sky-100 overflow-hidden">
        {profile?.coverImage ? (
          <Image
            source={{ uri: profile.coverImage }}
            className="w-full h-full"
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
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "transparent"]}
          className="absolute top-0 left-0 right-0 h-16"
        />
      </View>

      <View className="px-5 -mt-16 pb-6">
        <View className="flex-row justify-between items-end">
          <View className="relative shadow-2xl shadow-sky-400">
            <Image
              source={{
                uri:
                  profile?.image ||
                  user?.image ||
                  "https://api.dicebear.com/7.x/avataaars/png?seed=user1",
              }}
              className={`w-28 h-28 rounded-[40px] border-4 ${isDark ? "border-[#0F172A] bg-slate-800" : "border-white bg-white"}`}
              contentFit="cover"
              transition={300}
            />
            <View
              className={`absolute bottom-1 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 ${isDark ? "border-[#0F172A]" : "border-white"}`}
            />
          </View>

          <View className="flex-row items-center mb-1 space-x-2">
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className={`w-11 h-11 border mr-2 items-center justify-center rounded-2xl shadow-sm ${isDark ? "bg-slate-800 border-slate-700 shadow-none" : "bg-white border-gray-100"}`}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/profile/update")}
              className={`px-5 py-2.5 rounded-2xl border mr-2 shadow-sm ${isDark ? "bg-slate-800 border-slate-700 shadow-none" : "bg-white border-gray-100"}`}
            >
              <Text
                className={`font-black text-[13px] uppercase tracking-wider ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Edit profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className={`w-11 h-11 border items-center justify-center rounded-2xl ${isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100"}`}
            >
              <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row items-center">
            <Text
              className={`text-3xl font-black mt-1 tracking-tighter pt-5 mr-1 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {profile?.name || user?.name || "Member"}
            </Text>
            {profile?.isVerified && (
              <Ionicons name="checkmark-circle" size={22} color={accentColor} />
            )}
          </View>
          <Text
            className="font-bold text-[15px] -mt-1"
            style={{ color: accentColor }}
          >
            @{profile?.username || user?.username || "handle"}
          </Text>
        </View>

        <Text
          className={`mt-4 text-[16px] font-medium leading-[22px] ${isDark ? "text-slate-300" : "text-gray-600"}`}
        >
          {profile?.bio ||
            "Finding my rhythm in the infinite space of creativity. "}
        </Text>

        <View className="flex-row flex-wrap mt-4">
          {profile?.location && (
            <BlurView
              intensity={isDark ? 50 : 30}
              tint={isDark ? "dark" : "light"}
              className={`flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-white/50 bg-white/20"}`}
            >
              <Ionicons
                name="location"
                size={14}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                className={`ml-1.5 text-[13px] font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
              >
                {profile.location}
              </Text>
            </BlurView>
          )}
          <View
            className={`flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-white/50 bg-white/20"}`}
          >
            <Ionicons
              name="calendar"
              size={14}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
            <Text
              className={`ml-1.5 text-[13px] font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}
            >
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

        <View
          className={`flex-row mt-6 border rounded-[32px] p-4 items-center justify-between shadow-sm ${isDark ? "bg-slate-800/80 border-slate-700 shadow-none" : "bg-white/50 border-white/50"}`}
        >
          <TouchableOpacity
            className="items-center flex-1"
            onPress={() =>
              router.push({
                pathname: "/profile/following",
                params: { userId: user?.id },
              })
            }
          >
            <Text
              className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {profile?._count?.following || 0}
            </Text>
            <Text
              className={`font-bold text-[10px] uppercase tracking-[1.5px] mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}
            >
              Following
            </Text>
          </TouchableOpacity>

          <View
            className={`w-[1px] h-8 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}
          />

          <TouchableOpacity
            className="items-center flex-1"
            onPress={() =>
              router.push({
                pathname: "/profile/followers",
                params: { userId: user?.id },
              })
            }
          >
            <Text
              className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {profile?._count?.followers || 0}
            </Text>
            <Text
              className={`font-bold text-[10px] uppercase tracking-[1.5px] mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}
            >
              Followers
            </Text>
          </TouchableOpacity>

          <View
            className={`w-[1px] h-8 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}
          />

          <TouchableOpacity
            className="items-center flex-1"
            onPress={() =>
              router.push({
                pathname: "/bookmarks",
                params: { userId: user?.id },
              })
            }
          >
            <View
              style={{
                backgroundColor: isDark
                  ? `${accentColor}20`
                  : `${accentColor}10`,
              }}
              className="w-8 h-8 rounded-xl items-center justify-center"
            >
              <Ionicons name="bookmark" size={16} color={accentColor} />
            </View>
            <Text
              style={{ color: accentColor }}
              className="font-black text-[10px] uppercase tracking-[1.5px] mt-1"
            >
              Bookmarks
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className={isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}>
        <View className="flex-row px-5 py-3">
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
                className={`px-4 py-2.5 rounded-2xl ${
                  activeTab === tab
                    ? isDark
                      ? "bg-slate-800 border-slate-700 shadow-none border"
                      : "bg-white shadow-sm border border-gray-100"
                    : ""
                }`}
              >
                <Text
                  className={`font-black text-[11px] uppercase tracking-widest ${
                    activeTab === tab
                      ? "text-primary"
                      : isDark
                        ? "text-slate-500"
                        : "text-gray-400"
                  }`}
                  style={activeTab === tab ? { color: accentColor } : {}}
                >
                  {tab}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View
          className={`h-[1px] mx-5 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
        />
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
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
            tintColor={accentColor}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-20 px-10">
            <View
              className={`w-16 h-16 rounded-3xl items-center justify-center mb-4 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={32}
                color={isDark ? "#475569" : "#94A3B8"}
              />
            </View>
            <Text
              className={`text-xl font-black tracking-tight text-center uppercase ${isDark ? "text-white" : "text-gray-900"}`}
            >
              No {activeTab} yet
            </Text>
            <Text
              className={`text-center mt-2 font-medium leading-5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              Your {activeTab} will weave the social fabric of the community.
            </Text>
          </View>
        }
      />

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === user?.id}
        onDelete={async () => {
          if (!postForOptions) return;
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
