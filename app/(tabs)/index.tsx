import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetPostsQuery,
  useLikePostMutation,
  useReplyPostMutation,
  useRepostPostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
  useDeleteRepostMutation,
  useBlockUserMutation,
  useReportPostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import PostOptionsModal from "../../components/PostOptionsModal";

import PostCard, { Post } from "../../components/PostCard";
import { BlurView } from "expo-blur";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from "react-native-reanimated";

const TRENDING_TOPICS = [
  { id: "1", label: "Zen", icon: "leaf" },
  { id: "2", label: "Oasis", icon: "water" },
  { id: "3", label: "Design", icon: "color-palette" },
  { id: "4", label: "Code", icon: "code-working" },
  { id: "5", label: "Mindful", icon: "pulse" },
];

// ────────────────────────────────────────────────
// Feed Screen
// ────────────────────────────────────────────────
export default function FeedScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  const [cursor, setCursor] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  const user = useSelector((state: any) => state.auth.user);
  
  // Reanimated shared values
  const tabProgress = useSharedValue(0);

  const { data, isLoading, isFetching, refetch } = useGetPostsQuery(
    { type: activeTab, cursor },
    { skip: !user },
  );

  const posts = data?.posts ?? [];
  const nextCursor = data?.nextCursor;

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [replyPost] = useReplyPostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deleteRepost] = useDeleteRepostMutation();
  const [deletePost] = useDeletePostMutation();
  const [blockUser] = useBlockUserMutation();
  const [reportPost] = useReportPostMutation();

  // ─── Handlers ───────────────────────────────────────

  const handleTabChange = useCallback((tab: "public" | "private") => {
    setActiveTab(tab);
    setCursor(null);
    tabProgress.value = withSpring(tab === "public" ? 0 : 1, { damping: 20 });
  }, [tabProgress]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(tabProgress.value, [0, 1], [0, 140]) }
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
      const isRepostItem = !!post.isRepost;
      const realPostId =
        isRepostItem && post.originalPost ? post.originalPost.id : post.id;

      const alreadyReposted = post.repostedByMe ?? false;

      if (alreadyReposted) {
        // Undo repost
        Alert.alert("Undo Repost", "Remove this repost?", [
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
        // Repost or Quote
        Alert.alert("Repost", "Share this post?", [
          {
            text: "Repost",
            onPress: async () => {
              try {
                await repostPost({ id: realPostId }).unwrap();
              } catch (err: any) {
                if (err?.status === 400) {
                  Alert.alert("Note", "You have already reposted this.");
                } else {
                  console.error("Repost failed", err);
                }
              }
            },
          },
          {
            text: "Quote",
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
    [repostPost, deleteRepost, router],
  );

  const handleCommentSubmit = useCallback(async () => {
    if (!commentContent.trim() || !selectedPostId) return;
    try {
      await replyPost({
        postId: selectedPostId,
        content: commentContent,
      }).unwrap();
      setCommentContent("");
      setIsCommenting(false);
      setSelectedPostId(null);
    } catch (err) {
      console.error("Comment failed", err);
    }
  }, [commentContent, selectedPostId, replyPost]);

  const uniquePosts = Array.from(
    new Map(posts.map((item: any) => [item.id, item])).values(),
  ) as Post[];

  // ─── Render ─────────────────────────────────────────

  const renderTrending = () => (
    <View className="py-4 border-b border-gray-100">
      <View className="px-4 mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-gray-900 uppercase tracking-tighter">Trending Oasis</Text>
        <TouchableOpacity>
          <Text className="text-xs font-semibold text-sky-500">See all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TRENDING_TOPICS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="bg-sky-50 px-4 py-2.5 rounded-full mr-2.5 flex-row items-center border border-sky-100"
            onPress={() => router.push(`/explore?q=${encodeURIComponent(item.label)}`)}
          >
            <Ionicons name={item.icon as any} size={14} color="#0EA5E9" className="mr-2" />
            <Text className="text-sky-700 font-bold ml-1.5">#{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header with Blur (Floating effect) */}
      <BlurView intensity={80} tint="light" className="px-4 py-2 flex-row items-center justify-between border-b border-gray-50">
        <TouchableOpacity 
          onPress={() => router.push("/profile")}
          className="w-10 h-10 rounded-full border border-gray-100 overflow-hidden"
        >
          <Image
            source={{ uri: user?.image || "https://via.placeholder.com/40" }}
            className="w-full h-full"
          />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-xl font-bold tracking-tighter text-gray-900">Oasis</Text>
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premium</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.push("/settings/meditation")}
          className="w-10 h-10 rounded-full bg-sky-50 items-center justify-center border border-sky-100"
        >
          <Ionicons name="leaf-outline" size={20} color="#0EA5E9" />
        </TouchableOpacity>
      </BlurView>

      <FlatList
        data={uniquePosts}
        keyExtractor={(item, index) => `${item?.id}-${index}`}
        ListHeaderComponent={() => (
          <View>
            {/* Modern Tabs */}
            <View className="px-4 py-3">
              <View className="flex-row bg-gray-100/50 p-1.5 rounded-2xl h-14 relative">
                <Animated.View 
                  style={[
                    {
                      position: 'absolute',
                      top: 6,
                      bottom: 6,
                      left: 6,
                      width: '48%',
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                    indicatorStyle
                  ]}
                />
                <TouchableOpacity
                  className="flex-1 items-center justify-center z-10"
                  onPress={() => handleTabChange("public")}
                >
                  <Text
                    className={`font-bold transition-all ${
                      activeTab === "public" ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Explore
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center justify-center z-10"
                  onPress={() => handleTabChange("private")}
                >
                  <Text
                    className={`font-bold transition-all ${
                      activeTab === "private" ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Circular
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trending topics bar */}
            {activeTab === "public" && renderTrending()}
          </View>
        )}
        renderItem={({ item }) => (
          <PostCard
            item={item as Post}
            user={user}
            onPressPost={(id) => router.push(`/post/${id}`)}
            onPressProfile={(id) => router.push(`/profile/${id}`)}
            onPressOptions={(p) => {
              setPostForOptions(p);
              setOptionsModalVisible(true);
            }}
            onPressComment={(id) => {
              setSelectedPostId(id);
              setIsCommenting(true);
            }}
            onPressRepost={handleRepostAction}
            onLike={handleLike}
            onBookmark={handleBookmark}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !cursor}
            onRefresh={() => {
              setCursor(null);
              refetch();
            }}
            tintColor="#0EA5E9"
          />
        }
        onEndReached={() => nextCursor && setCursor(nextCursor)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetching && cursor ? (
            <ActivityIndicator className="py-6" color="#0EA5E9" />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB - Enhanced */}
      {!isCommenting && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/compose/post")}
          style={{
            shadowColor: "#0EA5E9",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 12,
          }}
          className="absolute bottom-10 right-6 bg-sky-500 w-16 h-16 rounded-full items-center justify-center border-4 border-white"
        >
          <Ionicons name="pencil-outline" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Reply modal */}
      {isCommenting && (
        <SafeAreaView className="absolute inset-0 bg-white z-50">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={() => setIsCommenting(false)}>
              <Text className="text-[17px] text-gray-700 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCommentSubmit}
              disabled={!commentContent.trim()}
              className={`px-6 py-2 rounded-full ${
                commentContent.trim() ? "bg-sky-500" : "bg-gray-300"
              }`}
            >
              <Text className="text-white font-bold">Reply</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row px-4 pt-4">
            <Image
              source={{ uri: user?.image || "https://via.placeholder.com/44" }}
              className="w-11 h-11 rounded-full mr-3 border border-gray-100"
            />
            <TextInput
              autoFocus
              multiline
              placeholder="Post your reply..."
              placeholderTextColor="#9CA3AF"
              value={commentContent}
              onChangeText={setCommentContent}
              className="flex-1 text-[17px] leading-6 text-gray-900 pt-1"
              maxLength={280}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      )}

      {/* Options modal */}
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
        onReport={async () => {
          if (!postForOptions?.id) return;
          try {
            await reportPost({
              id: postForOptions.id,
              reason: "SPAM",
            }).unwrap();
            alert("Thank you for reporting this post.");
            setOptionsModalVisible(false);
          } catch (error: any) {
            console.error("Error reporting post:", error);
            const errorMessage = error?.data?.message || "Something went wrong";
            alert(`Failed to report: ${errorMessage}`);
          }
        }}
        onBlock={async () => {
          if (!postForOptions?.author?.id) return;
          try {
            await blockUser({ id: postForOptions.author.id }).unwrap();
            alert(`Blocked @${postForOptions?.author?.name}`);
            setOptionsModalVisible(false);
            refetch();
          } catch (error: any) {
            console.error("Error blocking user:", error);
            const errorMessage = error?.data?.message || "Something went wrong";
            alert(`Failed to block: ${errorMessage}`);
          }
        }}
      />
    </SafeAreaView>
  );
}
