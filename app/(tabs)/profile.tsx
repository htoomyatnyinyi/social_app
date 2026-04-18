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
  ActivityIndicator,
  Dimensions,
  Modal,
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
  useDeleteRepostMutation,
} from "../../store/postApi";
import {
  useGetProfileQuery,
  useGetUserLikesQuery,
  useGetUserPostsQuery,
  useGetUserRepliesQuery,
} from "../../store/profileApi";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    "posts",
  );
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [repostModalVisible, setRepostModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);
  const [postForRepost, setPostForRepost] = useState<Post | null>(null);

  // TO CALL LOGOUT MODAL.
  // 1. Add this state at the top of your component
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // --- QUERIES ---
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(user?.id, { skip: !user?.id });

  const {
    data: postData,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useGetUserPostsQuery(
    { id: user?.id },
    { skip: !user?.id || activeTab !== "posts" },
  );

  const {
    data: likeData,
    isLoading: isLikesLoading,
    refetch: refetchLikes,
  } = useGetUserLikesQuery(
    { id: user?.id },
    { skip: !user?.id || activeTab !== "likes" },
  );

  const {
    data: replyData,
    isLoading: isRepliesLoading,
    refetch: refetchReplies,
  } = useGetUserRepliesQuery(
    { id: user?.id },
    { skip: !user?.id || activeTab !== "replies" },
  );

  // --- MUTATIONS ---
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deleteRepost] = useDeleteRepostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [deletePost] = useDeletePostMutation();

  // // --- LOGIC HANDLERS ---

  // 2. The handler that triggers the logout
  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLogoutModalVisible(false);
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
    const isRepostItem =
      !!postForRepost.isRepost || !!postForRepost.repostedByMe;
    const realPostId =
      isRepostItem && postForRepost.originalPost
        ? postForRepost.originalPost.id
        : postForRepost.id;

    try {
      if (postForRepost.repostedByMe) {
        await deleteRepost({ id: realPostId }).unwrap();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await repostPost({ id: realPostId }).unwrap();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error("Repost action failed", err);
    }
  }, [postForRepost, repostPost, deleteRepost]);

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

  // --- SUB-COMPONENTS ---
  const Header = () => (
    <View className={isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}>
      {/* Banner */}
      <View className="h-56 bg-slate-200 dark:bg-slate-800 overflow-hidden">
        {profile?.coverImage ? (
          <Image
            source={{ uri: profile.coverImage }}
            className="w-full h-full"
            contentFit="cover"
            transition={500}
          />
        ) : (
          <LinearGradient
            colors={[accentColor, "#818CF8", "#A5B4FC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-full opacity-40"
          />
        )}
      </View>

      {/* Profile Card Overlay */}
      <View
        className={`mx-5 -mt-20 p-6 rounded-[40px] border shadow-2xl ${
          isDark
            ? "bg-slate-900 border-slate-800 shadow-black/50"
            : "bg-white border-gray-100 shadow-slate-200"
        }`}
      >
        <View className="flex-row justify-between items-start">
          <View className="relative">
            <Image
              source={{
                uri:
                  profile?.image ||
                  user?.image ||
                  "https://api.dicebear.com/7.x/avataaars/png?seed=" +
                    user?.username,
              }}
              className={`w-28 h-28 rounded-[44px] border-4 ${isDark ? "border-slate-900 bg-slate-800" : "border-white bg-white"}`}
              contentFit="cover"
              transition={300}
            />
            <View
              className={`absolute bottom-1 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 ${isDark ? "border-slate-900" : "border-white"}`}
            />
          </View>

          <View className="flex-row items-center space-x-2 pt-2">
            <TouchableOpacity
              onPress={() => setIsLogoutModalVisible(true)}
              className={`w-11 h-11 mr-2 items-center justify-center rounded-2xl border ${isDark ? "bg-slate-800 border-red-700" : "bg-white border-red-100 shadow-sm"}`}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={"red"}
                // color={isDark ? "#94A3B8" : "#64748B"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/profile/update")}
              style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
              className="px-6 py-4 rounded-2xl mr-2"
            >
              <Text
                className={`font-black text-[10px] uppercase tracking-widest ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className={`w-11 h-11 items-center justify-center rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Name & Handle */}
        <View className="mt-6">
          <View className="flex-row items-center">
            <Text
              className={`text-3xl font-black tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {profile?.name || user?.name || "Member"}
            </Text>
            {profile?.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={accentColor}
                className="ml-1.5"
              />
            )}
          </View>
          <Text
            style={{ color: accentColor }}
            className="font-bold text-[14px]"
          >
            @{profile?.username || user?.username || "handle"}
          </Text>
        </View>

        {/* Bio */}
        <Text
          className={`mt-4 text-[15px] font-medium leading-[22px] ${isDark ? "text-slate-300" : "text-slate-600"}`}
        >
          {profile?.bio ||
            "Finding my rhythm in the infinite space of creativity."}
        </Text>

        {/* Metadata Badges */}
        <View className="flex-row flex-wrap mt-5">
          {profile?.location && (
            <View
              className={`flex-row items-center mr-3 mb-2 px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Ionicons name="location-outline" size={12} color={accentColor} />
              <Text
                className={`ml-1.5 text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {profile.location}
              </Text>
            </View>
          )}
          <View
            className={`flex-row items-center mr-3 mb-2 px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
          >
            <Ionicons name="calendar-outline" size={12} color={accentColor} />
            <Text
              className={`ml-1.5 text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
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
          {profile?.website && (
            <View
              className={`flex-row items-center mr-3 mb-2 px-3 py-1.5 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Ionicons name="link-outline" size={12} color={accentColor} />
              <Text
                className={`ml-1.5 text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {profile.website}
              </Text>
            </View>
          )}
        </View>

        {/* Meditation Quick Action */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/settings/meditation");
          }}
          className={`mt-4 flex-row items-center p-4 rounded-3xl border ${isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-100 shadow-sm"}`}
        >
          <View
            style={{ backgroundColor: `${accentColor}20` }}
            className="w-10 h-10 rounded-2xl items-center justify-center"
          >
            <Ionicons name="leaf" size={20} color={accentColor} />
          </View>
          <View className="ml-4 flex-1">
            <Text
              className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}
            >
              Mindfulness
            </Text>
            <Text
              className={`text-[15px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Daily Ritual
            </Text>
          </View>
          <View className="items-end mr-2">
            <Text style={{ color: accentColor }} className="font-black text-xs">
              {profile?.meditationStats?.totalMinutes || 0}m
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDark ? "#475569" : "#CBD5E1"}
          />
        </TouchableOpacity>

        {/* Stats Row */}
        <View className="flex-row items-center mt-8 pt-6 border-t border-slate-800/10">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/following",
                params: { userId: user?.id },
              })
            }
            className="flex-1"
          >
            <Text
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {profile?._count?.following || 0}
            </Text>
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Following
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/followers",
                params: { userId: user?.id },
              })
            }
            className="flex-1"
          >
            <Text
              className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {profile?._count?.followers || 0}
            </Text>
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Followers
            </Text>
          </TouchableOpacity>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => router.push("/analytics")}
              className={`w-11 h-11 items-center justify-center rounded-2xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Ionicons
                name="bar-chart-outline"
                size={18}
                color={accentColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/bookmarks")}
              className={`w-11 h-11 ml-12 items-center justify-center rounded-2xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              <Ionicons name="bookmark" size={18} color={accentColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button (Moved inside card for utility) */}

        {/* <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsLogoutModalVisible(true); // Open Modal instead of logging out immediately
          }}
          className="mt-6 py-4 rounded-2xl items-center border border-rose-500/10 bg-rose-500/5"
        >
          <Text className="text-rose-500 font-black text-[10px] uppercase tracking-[2px]">
            Sign Out of Universe
          </Text>
        </TouchableOpacity> */}
      </View>

      {/* Zen Tab Switcher */}
      <View className="px-5 mt-4 mb-2">
        <View
          className={`flex-row p-1.5 rounded-[24px] ${isDark ? "bg-slate-900" : "bg-gray-100"}`}
        >
          {(["posts", "replies", "likes"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              className={`flex-1 py-3.5 rounded-[18px] items-center ${
                activeTab === tab
                  ? isDark
                    ? "bg-slate-800 shadow-xl shadow-black/20"
                    : "bg-white shadow-sm"
                  : ""
              }`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${
                  activeTab === tab
                    ? isDark
                      ? "text-white"
                      : "text-slate-900"
                    : "text-slate-500"
                }`}
                style={activeTab === tab ? { color: accentColor } : {}}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
              onPressProfile={() => {}} // Current user, do nothing
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
          <View className="items-center py-24 px-10">
            <View
              className={`w-20 h-20 rounded-[32px] items-center justify-center mb-6 ${isDark ? "bg-slate-900" : "bg-gray-100"}`}
            >
              <Ionicons
                name={
                  activeTab === "likes" ? "heart-outline" : "chatbubble-outline"
                }
                size={32}
                color={isDark ? "#334155" : "#CBD5E1"}
              />
            </View>
            <Text
              className={`text-sm font-black tracking-widest uppercase text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              No {activeTab} discovered yet
            </Text>
          </View>
        }
      />

      {/* Post Actions Modal */}
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

      {/* Repost/Quote Modal */}
      <RepostModal
        isVisible={repostModalVisible}
        onClose={() => setRepostModalVisible(false)}
        onRepost={onDirectRepost}
        onQuote={onQuote}
        hasReposted={!!postForRepost?.repostedByMe}
      />

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center px-6 bg-black/60">
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? "dark" : "light"}
            className={`w-full p-8 rounded-[44px] border overflow-hidden ${
              isDark
                ? "bg-slate-900/90 border-slate-700"
                : "bg-white/90 border-gray-100"
            }`}
          >
            {/* Icon */}
            <View
              className="w-20 h-20 rounded-[30px] items-center justify-center self-center mb-6"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Ionicons name="log-out" size={32} color={accentColor} />
            </View>

            {/* Text Content */}
            <Text
              className={`text-2xl font-black text-center tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              End Session?
            </Text>
            <Text
              className={`text-center mt-3 font-medium leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              The universe will wait for your return. Are you sure you wish to
              leave the sanctuary?
            </Text>

            {/* Buttons */}
            <View className="mt-8 space-y-3">
              <TouchableOpacity
                onPress={handleLogout}
                // style={{ backgroundColor: accentColor }}
                className={`w-full bg-red-500 py-4 rounded-2xl items-center shadow-lg mb-2`}
              >
                <Text className="text-white font-black uppercase tracking-[2px] text-xs">
                  Confirm Sign Out
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsLogoutModalVisible(false);
                }}
                className={`w-full py-4 rounded-2xl items-center border mt-2 ${
                  isDark
                    ? "border-slate-700 bg-slate-800"
                    : "border-gray-100 bg-white"
                }`}
              >
                <Text
                  className={`font-black uppercase tracking-[2px] text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Stay in Universe
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

// original code
// import { Ionicons } from "@expo/vector-icons";
// import { BlurView } from "expo-blur";
// import * as Haptics from "expo-haptics";
// import { Image } from "expo-image";
// import { LinearGradient } from "expo-linear-gradient";
// import { router } from "expo-router";
// import React, { useCallback, useMemo, useState } from "react";
// import {
//   FlatList,
//   RefreshControl,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useDispatch, useSelector } from "react-redux";
// import { useTheme } from "../../context/ThemeContext";
// import PostCard, { Post } from "../../components/PostCard";
// import PostOptionsModal from "../../components/PostOptionsModal";
// import RepostModal from "../../components/RepostModal";
// import { logout } from "../../store/authSlice";
// import {
//   useBookmarkPostMutation,
//   useDeletePostMutation,
//   useLikePostMutation,
//   useRepostPostMutation,
//   useDeleteRepostMutation,
// } from "../../store/postApi";
// import {
//   useGetProfileQuery,
//   useGetUserLikesQuery,
//   useGetUserPostsQuery,
//   useGetUserRepliesQuery,
// } from "../../store/profileApi";

// export default function ProfileScreen() {
//   const user = useSelector((state: any) => state.auth.user);
//   const dispatch = useDispatch();
//   const insets = useSafeAreaInsets();
//   const { isDark, accentColor } = useTheme();

//   const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
//     "posts",
//   );
//   const [optionsModalVisible, setOptionsModalVisible] = useState(false);
//   const [repostModalVisible, setRepostModalVisible] = useState(false);
//   const [postForOptions, setPostForOptions] = useState<Post | null>(null);
//   const [postForRepost, setPostForRepost] = useState<Post | null>(null);

//   const {
//     data: profile,
//     isLoading: isProfileLoading,
//     refetch: refetchProfile,
//   } = useGetProfileQuery(user?.id, { skip: !user?.id });

//   const [likePost] = useLikePostMutation();
//   const [repostPost] = useRepostPostMutation();
//   const [deleteRepost] = useDeleteRepostMutation();
//   const [bookmarkPost] = useBookmarkPostMutation();
//   const [deletePost] = useDeletePostMutation();

//   const {
//     data: postData,
//     isLoading: isPostsLoading,
//     refetch: refetchPosts,
//   } = useGetUserPostsQuery(
//     { id: user?.id },
//     {
//       skip: !user?.id || activeTab !== "posts",
//     },
//   );

//   const {
//     data: likeData,
//     isLoading: isLikesLoading,
//     refetch: refetchLikes,
//   } = useGetUserLikesQuery(
//     { id: user?.id },
//     {
//       skip: !user?.id || activeTab !== "likes",
//     },
//   );

//   const {
//     data: replyData,
//     isLoading: isRepliesLoading,
//     refetch: refetchReplies,
//   } = useGetUserRepliesQuery(
//     { id: user?.id },
//     {
//       skip: !user?.id || activeTab !== "replies",
//     },
//   );

//   const handleLogout = () => {
//     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
//     router.replace("/auth");
//     setTimeout(() => dispatch(logout()), 100);
//   };

//   const onRefresh = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     refetchProfile();
//     if (activeTab === "posts") refetchPosts();
//     if (activeTab === "likes") refetchLikes();
//     if (activeTab === "replies") refetchReplies();
//   };

//   /**
//    * FIX LOGIC HERE:
//    * We ensure that "posts" ONLY contains items where parentPost AND parentId are null.
//    * We ensure "replies" ONLY contains items where parentPost OR parentId exists.
//    */

//   const currentData = useMemo(() => {
//     const posts = postData?.posts || [];
//     const likes = likeData?.posts || [];
//     const replies = replyData?.posts || [];

//     if (activeTab === "posts") {
//       return posts.filter((post: any) => {
//         // This checks every possible way a post might be flagged as a reply
//         const isActuallyAReply =
//           !!post.parentPost ||
//           !!post.parentId ||
//           !!post.replyToId ||
//           !!post.parent ||
//           post.type === "REPLY";

//         return !isActuallyAReply;
//       });
//     }

//     if (activeTab === "likes") return likes;

//     if (activeTab === "replies") {
//       return replies.filter((post: any) => {
//         const isActuallyAReply =
//           !!post.parentPost ||
//           !!post.parentId ||
//           !!post.replyToId ||
//           !!post.parent ||
//           post.type === "REPLY";

//         return isActuallyAReply;
//       });
//     }

//     return [];
//   }, [activeTab, postData, likeData, replyData]);

//   const isLoading =
//     isProfileLoading ||
//     (activeTab === "posts" && isPostsLoading) ||
//     (activeTab === "likes" && isLikesLoading) ||
//     (activeTab === "replies" && isRepliesLoading);

//   const handleLike = useCallback(
//     async (postId: string) => {
//       try {
//         await likePost({ postId }).unwrap();
//       } catch (err) {
//         console.error("Like failed", err);
//       }
//     },
//     [likePost],
//   );

//   const handleBookmark = useCallback(
//     async (postId: string) => {
//       try {
//         await bookmarkPost(postId).unwrap();
//         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       } catch (err) {
//         console.error("Bookmark failed", err);
//       }
//     },
//     [bookmarkPost],
//   );

//   const handleRepostAction = useCallback((post: Post) => {
//     setPostForRepost(post);
//     setRepostModalVisible(true);
//   }, []);

//   const onDirectRepost = useCallback(async () => {
//     if (!postForRepost) return;
//     const isRepostItem =
//       !!postForRepost.isRepost || !!postForRepost.repostedByMe;
//     const realPostId =
//       isRepostItem && postForRepost.originalPost
//         ? postForRepost.originalPost.id
//         : postForRepost.id;

//     try {
//       if (postForRepost.repostedByMe) {
//         await deleteRepost({ id: realPostId }).unwrap();
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       } else {
//         await repostPost({ id: realPostId }).unwrap();
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (err: any) {
//       console.error("Repost action failed", err);
//     }
//   }, [postForRepost, repostPost, deleteRepost]);

//   const onQuote = useCallback(() => {
//     if (!postForRepost) return;
//     router.push({
//       pathname: "/compose/post",
//       params: {
//         quoteId: postForRepost.id,
//         quoteContent: postForRepost.content,
//         quoteAuthor: postForRepost.author?.name || "Member",
//       },
//     });
//   }, [postForRepost]);

//   const Header = () => (
//     <View className={isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}>
//       <View className="h-44 bg-sky-100 overflow-hidden">
//         {profile?.coverImage ? (
//           <Image
//             source={{ uri: profile.coverImage }}
//             className="w-full h-full"
//             contentFit="cover"
//             transition={500}
//           />
//         ) : (
//           <LinearGradient
//             colors={["#0EA5E9", "#38BDF8", "#7DD3FC"]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             className="w-full h-full"
//           />
//         )}
//         <LinearGradient
//           colors={["rgba(0,0,0,0.15)", "transparent"]}
//           className="absolute top-0 left-0 right-0 h-16"
//         />
//       </View>

//       <View className="px-5 -mt-16 pb-6">
//         <View className="flex-row justify-between items-end">
//           <View className="relative shadow-2xl shadow-sky-400">
//             <Image
//               source={{
//                 uri:
//                   profile?.image ||
//                   user?.image ||
//                   "https://api.dicebear.com/7.x/avataaars/png?seed=user1",
//               }}
//               className={`w-28 h-28 rounded-[40px] border-4 ${isDark ? "border-[#0F172A] bg-slate-800" : "border-white bg-white"}`}
//               contentFit="cover"
//               transition={300}
//             />
//             <View
//               className={`absolute bottom-1 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 ${isDark ? "border-[#0F172A]" : "border-white"}`}
//             />
//           </View>

//           <View className="flex-row items-center mb-1 space-x-2">
//             <TouchableOpacity
//               onPress={() => router.push("/settings")}
//               className={`w-11 h-11 border mr-2 items-center justify-center rounded-2xl shadow-sm ${isDark ? "bg-slate-800 border-slate-700 shadow-none" : "bg-white border-gray-100"}`}
//             >
//               <Ionicons
//                 name="settings-outline"
//                 size={20}
//                 color={isDark ? "#94A3B8" : "#64748B"}
//               />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => router.push("/analytics")}
//               className={`w-11 h-11 border mr-2 items-center justify-center rounded-2xl shadow-sm ${isDark ? "bg-slate-800 border-slate-700 shadow-none" : "bg-white border-gray-100"}`}
//             >
//               <Ionicons
//                 name="bar-chart"
//                 size={20}
//                 color={accentColor}
//               />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => router.push("/profile/update")}
//               className={`px-5 py-2.5 rounded-2xl border mr-2 shadow-sm ${isDark ? "bg-slate-800 border-slate-700 shadow-none" : "bg-white border-gray-100"}`}
//             >
//               <Text
//                 className={`font-black text-[13px] uppercase tracking-wider ${isDark ? "text-white" : "text-gray-900"}`}
//               >
//                 Edit profile
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={handleLogout}
//               className={`w-11 h-11 border items-center justify-center rounded-2xl ${isDark ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100"}`}
//             >
//               <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View className="mt-4">
//           <View className="flex-row items-center">
//             <Text
//               className={`text-3xl font-black mt-1 tracking-tighter pt-5 mr-1 ${isDark ? "text-white" : "text-gray-900"}`}
//             >
//               {profile?.name || user?.name || "Member"}
//             </Text>
//             {profile?.isVerified && (
//               <Ionicons name="checkmark-circle" size={22} color={accentColor} />
//             )}
//           </View>
//           <Text
//             className="font-bold text-[15px] -mt-1"
//             style={{ color: accentColor }}
//           >
//             @{profile?.username || user?.username || "handle"}
//           </Text>
//         </View>

//         <Text
//           className={`mt-4 text-[16px] font-medium leading-[22px] ${isDark ? "text-slate-300" : "text-gray-600"}`}
//         >
//           {profile?.bio ||
//             "Finding my rhythm in the infinite space of creativity. "}
//         </Text>

//         {/* Location & Joined Tags */}
//         <View className="flex-row flex-wrap mt-4">
//           {profile?.location && (
//             <View className={`flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-white/50 bg-white/20"}`}>
//               <Ionicons name="location" size={14} color={isDark ? "#94A3B8" : "#64748B"} />
//               <Text className={`ml-1.5 text-[13px] font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}>{profile.location}</Text>
//             </View>
//           )}
//           <View className={`flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-white/50 bg-white/20"}`}>
//             <Ionicons name="calendar" size={14} color={isDark ? "#94A3B8" : "#64748B"} />
//             <Text className={`ml-1.5 text-[13px] font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}>
//               Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleString("default", { month: "short", year: "numeric" }) : "2026"}
//             </Text>
//           </View>
//           <View className={`flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-white/50 bg-white/20"}`}>
//             <Ionicons name="calendar" size={14} color={isDark ? "#94A3B8" : "#64748B"} />
//             <Text className={`ml-1.5 text-[13px] font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}>
//               {profile?.meditationStats?.totalMinutes || 0}m
//             </Text>
//           </View>
//           {/* weburl */}
//           <View className={`flex-row items-center mr-4 mb-2 px-3 py-1.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-white/50 bg-white/20"}`}>

//             <Text className={`ml-1.5 text-[13px] font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}>{profile?.website}</Text>
//           </View>
//         </View>

//         {/* NEW: Dedicated Meditation Route at the bottom of the Header */}
//         <TouchableOpacity
//           onPress={() => {
//             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//             router.push('/settings/meditation');
//           }}
//           activeOpacity={0.7}
//           className={`mt-2 mb-4 overflow-hidden rounded-3xl border ${isDark ? "bg-slate-800/40 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}
//         >
//           <LinearGradient
//             colors={isDark ? ["#1e293b00", "#1e293b00"] : ["#ffffff00", "#f8fafc00"]}
//             className="px-5 py-4 flex-row items-center justify-between"
//           >
//             <View className="flex-row items-center">
//               <View
//                 style={{ backgroundColor: `${accentColor}20` }}
//                 className="w-10 h-10 rounded-2xl items-center justify-center"
//               >
//                 <Ionicons name="leaf" size={20} color={accentColor} />
//               </View>
//               <View className="ml-4">
//                 <Text className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
//                   Daily Mindfulness
//                 </Text>
//                 <Text className={`text-[15px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
//                   Continue Meditation
//                 </Text>
//               </View>
//             </View>

//             <View className="flex-row items-center">
//               <View className="mr-3 items-end">
//                 <Text style={{ color: accentColor }} className="font-black text-xs">
//                   {profile?.meditationStats?.totalMinutes || 0}m
//                 </Text>
//               </View>
//               <Ionicons name="chevron-forward" size={18} color={isDark ? "#475569" : "#CBD5E1"} />
//             </View>
//           </LinearGradient>
//         </TouchableOpacity>

//         {/* Followers/Following Row */}
//         <View className="flex-row items-center justify-between px-2 mb-4">
//           {/* ... rest of your following/followers code ... */}
//         </View>
//         <View
//           className="flex-row"
//         // className={`flex-row mt-6 border rounded-[32px] p-4 items-center justify-between shadow-sm ${isDark ? "bg-slate-800/80 border-slate-700 shadow-none" : "bg-white/50 border-white/50"}`}
//         >
//           <TouchableOpacity
//             className="items-center flex-1"
//             onPress={() =>
//               router.push({
//                 pathname: "/profile/following",
//                 params: { userId: user?.id },
//               })
//             }
//           >
//             <Text
//               className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
//             >
//               {profile?._count?.following || 0}
//             </Text>
//             <Text
//               className={`font-bold text-[10px] uppercase tracking-[1.5px] mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}
//             >
//               Following
//             </Text>
//           </TouchableOpacity>

//           <View
//             className={`w-[1px] h-8 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}
//           />

//           <TouchableOpacity
//             className="items-center flex-1"
//             onPress={() =>
//               router.push({
//                 pathname: "/profile/followers",
//                 params: { userId: user?.id },
//               })
//             }
//           >
//             <Text
//               className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
//             >
//               {profile?._count?.followers || 0}
//             </Text>
//             <Text
//               className={`font-bold text-[10px] uppercase tracking-[1.5px] mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}
//             >
//               Followers
//             </Text>
//           </TouchableOpacity>

//           <View
//             className={`w-[1px] h-8 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}
//           />

//           <TouchableOpacity
//             className="items-center flex-1"
//             onPress={() =>
//               router.push({
//                 pathname: "/bookmarks",
//                 params: { userId: user?.id },
//               })
//             }
//           >
//             <View
//               style={{
//                 backgroundColor: isDark
//                   ? `${accentColor}20`
//                   : `${accentColor}10`,
//               }}
//               className="w-8 h-8 rounded-xl items-center justify-center"
//             >
//               <Ionicons name="bookmark" size={16} color={accentColor} />
//             </View>
//             <Text
//               style={{ color: accentColor }}
//               className="font-black text-[10px] uppercase tracking-[1.5px] mt-1"
//             >
//               Bookmarks
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View className={isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}>
//         <View className="flex-row px-5 py-3">
//           {(["posts", "replies", "likes"] as const).map((tab) => (
//             <TouchableOpacity
//               key={tab}
//               onPress={() => {
//                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//                 setActiveTab(tab);
//               }}
//               className="flex-1 items-center"
//             >
//               <View
//                 className={`px-4 py-2.5 rounded-2xl ${activeTab === tab
//                   ? isDark
//                     ? "bg-slate-800 border-slate-700 shadow-none border"
//                     : "bg-white shadow-sm border border-gray-100"
//                   : ""
//                   }`}
//               >
//                 <Text
//                   className={`font-black text-[11px] uppercase tracking-widest ${activeTab === tab
//                     ? "text-primary"
//                     : isDark
//                       ? "text-slate-500"
//                       : "text-gray-400"
//                     }`}
//                   style={activeTab === tab ? { color: accentColor } : {}}
//                 >
//                   {tab}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>
//         <View
//           className={`h-[1px] mx-5 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
//         />

//       </View>

//     </View>
//   );

//   return (
//     <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
//       <FlatList
//         data={currentData}
//         ListHeaderComponent={Header}
//         renderItem={({ item }) => (
//           <View className="px-5 mt-4">
//             <PostCard
//               item={item}
//               user={user}
//               onPressPost={(id) => router.push(`/post/${id}`)}
//               onPressProfile={(id) =>
//                 id !== user?.id && router.push(`/profile/${id}`)
//               }
//               onPressOptions={(p) => {
//                 setPostForOptions(p);
//                 setOptionsModalVisible(true);
//               }}
//               onPressComment={(id) => router.push(`/post/${id}`)}
//               onPressRepost={handleRepostAction}
//               onLike={handleLike}
//               onBookmark={handleBookmark}
//             />
//           </View>
//         )}
//         keyExtractor={(item, index) => `${item.id}-${index}`}
//         refreshControl={
//           <RefreshControl
//             refreshing={isLoading}
//             onRefresh={onRefresh}
//             tintColor={accentColor}
//           />
//         }
//         contentContainerStyle={{ paddingBottom: 100 }}
//         showsVerticalScrollIndicator={false}
//         ListEmptyComponent={
//           <View className="items-center py-20 px-10">
//             <View
//               className={`w-16 h-16 rounded-3xl items-center justify-center mb-4 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
//             >
//               <Ionicons
//                 name="chatbubbles-outline"
//                 size={32}
//                 color={isDark ? "#475569" : "#94A3B8"}
//               />
//             </View>
//             <Text
//               className={`text-xl font-black tracking-tight text-center uppercase ${isDark ? "text-white" : "text-gray-900"}`}
//             >
//               No {activeTab} yet
//             </Text>
//             <Text
//               className={`text-center mt-2 font-medium leading-5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
//             >
//               Your {activeTab} will weave the social fabric of the community.
//             </Text>
//           </View>
//         }
//       />

//       <PostOptionsModal
//         isVisible={optionsModalVisible}
//         onClose={() => setOptionsModalVisible(false)}
//         isOwner={postForOptions?.author?.id === user?.id}
//         onDelete={async () => {
//           if (!postForOptions) return;
//           try {
//             await deletePost({ id: postForOptions.id }).unwrap();
//             setOptionsModalVisible(false);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           } catch (err) {
//             console.error("Delete failed", err);
//           }
//         }}
//       />
//       <RepostModal
//         isVisible={repostModalVisible}
//         onClose={() => setRepostModalVisible(false)}
//         onRepost={onDirectRepost}
//         onQuote={onQuote}
//         hasReposted={!!postForRepost?.repostedByMe}
//       />
//     </View>
//   );
// }
