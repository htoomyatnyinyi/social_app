import React, { useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import {
  useGetBookmarksQuery,
  useLikePostMutation,
  useBookmarkPostMutation,
  useRepostPostMutation,
  useDeleteRepostMutation,
} from "@/store/postApi";
import { useSelector } from "react-redux";
import PostCard, { Post } from "@/components/PostCard";
import PostOptionsModal from "@/components/PostOptionsModal";
import RepostModal from "@/components/RepostModal";

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();
  const user = useSelector((state: any) => state.auth.user);

  // 1. Match the API structure: bookmarks is an object { posts: Post[], users: Object }
  const {
    data: bookmarkData,
    isLoading,
    refetch,
    isFetching,
  } = useGetBookmarksQuery(undefined, { skip: !user?.id });

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deleteRepost] = useDeleteRepostMutation();

  const [optionsModalVisible, setOptionsModalVisible] = React.useState(false);
  const [repostModalVisible, setRepostModalVisible] = React.useState(false);
  const [postForOptions, setPostForOptions] = React.useState<Post | null>(null);
  const [postForRepost, setPostForRepost] = React.useState<Post | null>(null);

  // 2. Safely extract the posts array based on your transformNormalizedResponse
  const bookmarks = useMemo(() => bookmarkData?.posts || [], [bookmarkData]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      await likePost({ postId }).unwrap();
    } catch (err) {
      console.error("Like failed", err);
    }
  }, [likePost]);

  const handleBookmark = useCallback(async (postId: string) => {
    try {
      await bookmarkPost(postId).unwrap();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  }, [bookmarkPost]);

  const handleRepostAction = useCallback((post: Post) => {
    setPostForRepost(post);
    setRepostModalVisible(true);
  }, []);

  const onDirectRepost = useCallback(async () => {
    if (!postForRepost) return;
    const realPostId = postForRepost.originalPost?.id || postForRepost.id;

    try {
      if (postForRepost.repostedByMe) {
        await deleteRepost({ id: realPostId }).unwrap();
      } else {
        await repostPost({ id: realPostId }).unwrap();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Repost failed", err);
    }
  }, [postForRepost, repostPost, deleteRepost]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  }, [refetch]);

  if (isLoading && !isFetching) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        className={`px-5 pb-5 z-50 border-b ${isDark ? "border-slate-800/50" : "border-gray-100/50"}`}
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleBack}
            className={`w-10 h-10 rounded-2xl items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm shadow-gray-100"
              } mr-4`}
          >
            <Ionicons name="chevron-back" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>
          <View>
            <Text className={`text-2xl font-black tracking-[-1.5px] uppercase ${isDark ? "text-white" : "text-gray-900"}`}>
              Bookmarks
            </Text>
            <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {bookmarks.length} Saved {bookmarks.length === 1 ? 'Post' : 'Posts'}
            </Text>
          </View>
        </View>
      </BlurView>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => `bookmark-${item.id}`}
        renderItem={({ item }) => (
          <View className="px-3">
            <PostCard
              item={item}
              user={user || null}
              onPressPost={(id) => router.push(`/post/${id}`)}
              onPressProfile={(id) => router.push(`/profile/${id}`)}
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
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={accentColor}
          />
        }
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-32 px-14">
            <View className={`w-24 h-24 rounded-[40px] items-center justify-center mb-10 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"
              }`}>
              <Ionicons name="bookmark" size={42} color={accentColor} />
            </View>
            <Text className={`text-xl font-black text-center mb-2 uppercase tracking-widest ${isDark ? "text-slate-200" : "text-gray-900"}`}>
              Library Empty
            </Text>
            <Text className="text-slate-500 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
              Posts you bookmark will appear here for quick access.
            </Text>
          </View>
        }
      />

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === user?.id}
        onDelete={() => {
          setOptionsModalVisible(false);
          refetch();
        }}
      />

      <RepostModal
        isVisible={repostModalVisible}
        onClose={() => setRepostModalVisible(false)}
        onRepost={onDirectRepost}
        onQuote={() => {
          if (!postForRepost) return;
          router.push({
            pathname: "/compose/post",
            params: { quoteId: postForRepost.id, quoteContent: postForRepost.content },
          });
        }}
        hasReposted={!!postForRepost?.repostedByMe}
      />
    </View>
  );
}