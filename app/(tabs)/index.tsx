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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      {/* <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={{ uri: user?.image || "https://via.placeholder.com/36" }}
            className="w-9 h-9 rounded-full"
          />
        </TouchableOpacity>
        <Text className="text-2xl font-bold tracking-tight">Oasis</Text>
        <Ionicons name="sparkles-outline" size={24} color="#000" />
      </View> */}

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100">
        {["public", "private"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 items-center py-3.5"
            onPress={() => {
              setCursor(null);
              setActiveTab(tab as "public" | "private");
            }}
          >
            <Text
              className={`font-semibold text-[15px] ${
                activeTab === tab ? "text-black" : "text-gray-500"
              }`}
            >
              {tab === "public" ? "For you" : "Following"}
            </Text>
            {activeTab === tab && (
              <View className="absolute bottom-0 w-12 h-1 bg-sky-500 rounded-full" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={uniquePosts}
        keyExtractor={(item, index) => `${item?.id}-${index}`}
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
            tintColor="#1d9bf0"
          />
        }
        onEndReached={() => nextCursor && setCursor(nextCursor)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetching && cursor ? (
            <ActivityIndicator className="py-6" color="#1d9bf0" />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB */}
      {!isCommenting && (
        <TouchableOpacity
          onPress={() => router.push("/compose/post")}
          className="absolute bottom-7 right-6 bg-sky-500 w-14 h-14 rounded-full items-center justify-center shadow-xl shadow-sky-500/40"
        >
          <Ionicons name="add" size={32} color="white" />
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
              className="w-11 h-11 rounded-full mr-3"
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
