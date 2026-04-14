import React, { useCallback } from "react";
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
// import { useTheme } from "../../context/ThemeContext";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import {
  useGetBookmarksQuery,
  useLikePostMutation,
  useBookmarkPostMutation,
  useRepostPostMutation,
} from "@/store/postApi";
import { useSelector } from "react-redux";
import PostCard, { Post } from "@/components/PostCard";
import PostOptionsModal from "@/components/PostOptionsModal";
import RepostModal from "@/components/RepostModal";

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const user = useSelector((state: any) => state.auth.user);

  const {
    data: bookmarks,
    isLoading,
    refetch,
    isFetching,
  } = useGetBookmarksQuery({}, { skip: !user });

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [repostPost] = useRepostPostMutation();

  const [optionsModalVisible, setOptionsModalVisible] = React.useState(false);
  const [repostModalVisible, setRepostModalVisible] = React.useState(false);
  const [postForOptions, setPostForOptions] = React.useState<Post | null>(null);
  const [postForRepost, setPostForRepost] = React.useState<Post | null>(null);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

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
      setPostForRepost(post);
      setRepostModalVisible(true);
    },
    [],
  );

  const onDirectRepost = useCallback(async () => {
    if (!postForRepost) return;
    const isRepostItem = !!postForRepost.isRepost || !!postForRepost.repostedByMe;
    const realPostId = isRepostItem && postForRepost.originalPost ? postForRepost.originalPost.id : postForRepost.id;

    try {
      await repostPost({ id: realPostId }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      if (err?.status === 400) {
        // Alert.alert("Already Reposted", "You have already shared this post.");
      }
    }
  }, [postForRepost, repostPost]);

  const onQuote = useCallback(() => {
    if (!postForRepost) return;
    const isRepostItem = !!postForRepost.isRepost || !!postForRepost.repostedByMe;
    const displayPost = isRepostItem && postForRepost.originalPost ? postForRepost.originalPost : postForRepost;

    router.push({
      pathname: "/compose/post",
      params: {
        quoteId: displayPost.id,
        quoteContent: displayPost.content,
        quoteAuthor: displayPost.author?.name || "Member",
      },
    });
  }, [postForRepost]);

  const handlePressPost = useCallback(
    (id: string) => {
      router.push(`/post/${id}`);
    },
    [router],
  );

  const handlePressProfile = useCallback(
    (id: string) => {
      router.push(`/profile/${id}`);
    },
    [router],
  );

  const handlePressOptions = useCallback((p: Post) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPostForOptions(p);
    setOptionsModalVisible(true);
  }, []);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  }, [refetch]);

  if (isLoading && !isFetching) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Header */}
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        className={`px-5 pb-5 z-50 border-b ${isDark ? "border-slate-800/50" : "border-gray-100/50"}`}
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100 mr-4"
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-black text-gray-900 tracking-[-1.5px] uppercase">
              Bookmarks
            </Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Saved Posts
            </Text>
          </View>
        </View>
      </BlurView>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-3">
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
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor="#0EA5E9"
          />
        }
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-32 px-14 opacity-20">
            <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center mb-10 border border-gray-100">
              <Ionicons name="bookmark" size={48} color="#94A3B8" />
            </View>
            <Text className="text-xl font-black text-center mb-2 text-gray-900 uppercase tracking-widest">
              No Bookmarks
            </Text>
            <Text className="text-gray-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
              You have not saved any posts here yet.
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
        onQuote={onQuote}
        hasReposted={!!postForRepost?.repostedByMe}
      />
    </View>
  );
}
