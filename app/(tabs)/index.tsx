import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
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
import { useTheme } from "../../context/ThemeContext";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import PostCard, { Post } from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import {
  useBlockUserMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
  useDeleteRepostMutation,
  useGetPostsQuery,
  useLikePostMutation,
  useReportPostMutation,
  useRepostPostMutation,
} from "../../store/postApi";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  const [cursor, setCursor] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  const user = useSelector((state: any) => state.auth.user);
  const tabProgress = useSharedValue(0);

  const { data, isLoading, isFetching, refetch } = useGetPostsQuery(
    { type: activeTab, cursor },
    { skip: !user },
  );

  const posts = data?.posts ?? [];
  const nextCursor = data?.nextCursor;

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deleteRepost] = useDeleteRepostMutation();
  const [deletePost] = useDeletePostMutation();
  const [blockUser] = useBlockUserMutation();
  const [reportPost] = useReportPostMutation();

  const handleTabChange = useCallback(
    (tab: "public" | "private") => {
      if (tab === activeTab) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(tab);
      setCursor(null);
      tabProgress.value = withSpring(tab === "public" ? 0 : 1, {
        damping: 20,
        stiffness: 120,
      });
    },
    [activeTab, tabProgress],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(tabProgress.value, [0, 1], [0, 150]) },
      ],
    };
  });

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await bookmarkPost(postId).unwrap();
      } catch (err) {
        console.error("Bookmark failed", err);
      }
    },
    [bookmarkPost],
  );

  const handleRepostAction = useCallback(
    (post: Post) => {
      const isRepostItem = !!post.isRepost || !!post.repostedByMe;
      const realPostId =
        isRepostItem && post.originalPost ? post.originalPost.id : post.id;
      const alreadyReposted = post.repostedByMe ?? false;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (alreadyReposted) {
        Alert.alert("Undo Repost", "Remove this post from your timeline?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteRepost(realPostId).unwrap();
              } catch (err) {
                console.error("Delete repost failed", err);
              }
            },
          },
        ]);
      } else {
        Alert.alert("Share Post", "How would you like to share this post?", [
          {
            text: "Repost Directly",
            onPress: async () => {
              try {
                await repostPost({ id: realPostId }).unwrap();
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              } catch (err: any) {
                if (err?.status === 400) {
                  Alert.alert(
                    "Already Reposted",
                    "You have already shared this post.",
                  );
                }
              }
            },
          },
          {
            text: "Quote Post",
            onPress: () => {
              router.push({
                pathname: "/compose/post",
                params: { quoteId: realPostId },
              });
            },
          },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    },
    [repostPost, deleteRepost],
    // [router, repostPost, deletePost]
  );

  const handlePressPost = useCallback(
    (id: string) => {
      router.push(`/post/${id}`);
    },
    [],
    // [router],
  );

  const handlePressProfile = useCallback(
    (id: string) => {
      router.push(`/profile/${id}`);
    },
    // [router],
    [],
  );

  const handlePressOptions = useCallback((p: Post) => {
    setPostForOptions(p);
    setOptionsModalVisible(true);
  }, []);

  const uniquePosts = useMemo(() => {
    const map = new Map();
    posts.forEach((p: any) => map.set(p.id, p));
    return Array.from(map.values()) as Post[];
  }, [posts]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCursor(null);
    refetch();
  }, [refetch]);

  const { isDark, accentColor } = useTheme();

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* Premium Sticky Header */}
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        className={`flex-row items-center justify-between px-5 pb-4 z-50 border-b ${isDark ? "border-slate-800/50" : "border-gray-100/50"}`}
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/profile");
          }}
          className={`${isDark ? "shadow-black" : "shadow-sky-100"} shadow-md`}
        >
          <Image
            source={{
              uri:
                user?.image ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.id}`,
            }}
            className={`w-10 h-10 rounded-[16px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-50"}`}
            contentFit="cover"
            transition={300}
          />
        </TouchableOpacity>

        <View className="items-center">
          <Text
            className={`text-2xl font-black tracking-[-1.5px] uppercase ${isDark ? "text-white" : "text-gray-900"}`}
          >
            ARKTA
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/settings");
          }}
          className={`w-10 h-10 rounded-[16px] items-center justify-center border shadow-sm ${
            isDark
              ? "bg-slate-800 border-slate-700 shadow-black"
              : "bg-white border-gray-50 shadow-gray-100"
          }`}
        >
          <Ionicons
            name="settings"
            size={20}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </TouchableOpacity>
      </BlurView>

      <FlatList
        data={uniquePosts}
        keyExtractor={(item, index) => `${item?.id}-${index}`}
        ListHeaderComponent={() => (
          <View>
            <View className="px-5 py-5">
              <View
                className={`flex-row p-1.5 rounded-[24px] h-[52px] relative border ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800"
                    : "bg-gray-100/30 border-gray-100/80"
                }`}
              >
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      top: 4,
                      bottom: 4,
                      left: 4,
                      width: "48%",
                      backgroundColor: isDark ? "#1E293B" : "white",
                      borderRadius: 20,
                      shadowColor: accentColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                    indicatorStyle,
                  ]}
                />
                <TouchableOpacity
                  className="flex-1 items-center justify-center z-10"
                  onPress={() => handleTabChange("public")}
                >
                  <Text
                    className={`font-black uppercase tracking-widest text-[10px] ${
                      activeTab === "public"
                        ? isDark
                          ? "text-white"
                          : "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    Public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center justify-center z-10"
                  onPress={() => handleTabChange("private")}
                >
                  <Text
                    className={`font-black uppercase tracking-widest text-[10px] ${
                      activeTab === "private"
                        ? isDark
                          ? "text-white"
                          : "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    Following
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="px-3">
            <PostCard
              item={item as Post}
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !cursor}
            onRefresh={onRefresh}
            tintColor={accentColor}
            colors={[accentColor]}
          />
        }
        onEndReached={() => {
          if (nextCursor && !isFetching) {
            setCursor(nextCursor);
          }
        }}
        onEndReachedThreshold={0.4}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        ListFooterComponent={
          isFetching && cursor ? (
            <ActivityIndicator className="py-8" color={accentColor} />
          ) : (
            <View className="py-20 items-center opacity-20">
              <Ionicons
                name="infinite"
                size={20}
                color={isDark ? "#475569" : "#94A3B8"}
              />
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/compose/post");
        }}
        style={{
          backgroundColor: accentColor,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
          elevation: 10,
        }}
        className="absolute bottom-28 right-6 w-16 h-16 rounded-[24px] items-center justify-center border-2 border-white/20"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === user?.id}
        onDelete={async () => {
          if (!postForOptions?.id) return;
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deletePost({ id: postForOptions.id }).unwrap();
            setOptionsModalVisible(false);
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
        onReport={async () => {
          if (!postForOptions?.id) return;
          try {
            await reportPost({
              id: postForOptions.id,
              reason: "SPAM",
            }).unwrap();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setOptionsModalVisible(false);
          } catch (error: any) {
            console.error("Error reporting post:", error);
          }
        }}
        onBlock={async () => {
          if (!postForOptions?.author?.id) return;
          try {
            await blockUser({ id: postForOptions.author.id }).unwrap();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setOptionsModalVisible(false);
            refetch();
          } catch (error: any) {
            console.error("Error blocking user:", error);
          }
        }}
      />
    </View>
  );
}
