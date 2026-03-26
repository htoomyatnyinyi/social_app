import React, { useState, useCallback, useRef, memo, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetThreadQuery,
  useReplyPostMutation,
  useLikePostMutation,
  useRepostPostMutation,
  useIncrementViewCountMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";
import { useFollowUserMutation } from "@/store/profileApi";
import { SafeAreaView } from "react-native-safe-area-context";
import PostOptionsModal from "../../components/PostOptionsModal";

// ────────────────────────────────────────────────
// Tree Builder helper
// ────────────────────────────────────────────────
function buildThreadTree(posts: any[], rootId: string) {
  const map = new Map<string, any>();
  // Clone and add replies array
  posts.forEach(p => map.set(p.id, { ...p, replies: [] }));

  const rootReplies: any[] = [];
  const sortedPosts = [...map.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  sortedPosts.forEach(p => {
    if (p.id === rootId) return;

    if (p.replyToId && map.has(p.replyToId)) {
      const parent = map.get(p.replyToId);
      p.parent = parent; // Link parent for UI
      if (p.replyToId === rootId) {
        rootReplies.push(p);
      } else {
        // Prevent deeply nested replies from breaking the view, map them sequentially by time or append to parent
        parent.replies.push(p);
      }
    } else {
      rootReplies.push(p);
    }
  });

  return { rootPost: map.get(rootId), topLevelReplies: rootReplies };
}

// ────────────────────────────────────────────────
// Memoized Reply Item (formerly CommentItem)
// ────────────────────────────────────────────────
const ReplyItem = memo(
  ({
    item,
    currentUserId,
    onReply,
    onOptions,
  }: {
    item: any;
    currentUserId?: string;
    onReply: (postId: string, username: string) => void;
    onOptions: (item: any) => void;
  }) => {
    const isDeepReply = !!item.replyToId && item.parent && item.parent.id !== item.conversationId;

    const [likePost] = useLikePostMutation();
    const [repostPost] = useRepostPostMutation();
    const router = useRouter();

    const handleLike = useCallback(async () => {
      try {
        await likePost({ postId: item.id }).unwrap();
      } catch (err) {
        console.error("Failed to like reply:", err);
      }
    }, [likePost, item.id]);

    const handleRepost = useCallback(async () => {
      try {
        await repostPost({ id: item.id }).unwrap();
      } catch (err) {
        console.error("Failed to repost reply:", err);
      }
    }, [repostPost, item.id]);

    const handleShare = useCallback(async () => {
      try {
        const urlToShare = `https://oasis-social.com/post/${item.id}`;
        await Share.share({
          message: `Check out this reply by @${item.author?.username || item.author?.name}: "${item.content}"\n${urlToShare}`,
        });
      } catch (error) {
        console.error("Error sharing reply:", error);
      }
    }, [item]);

    const hasLiked = item.isLiked ?? false;
    const hasReposted = item.repostedByMe ?? false;

    return (
      <View
        className={`${isDeepReply ? "ml-8 border-l-2 border-gray-200 pl-3" : "border-b border-gray-100"} bg-white`}
      >
        <TouchableOpacity
          onPress={() => router.push(`/post/${item.id}`)}
          className="flex-row p-4"
        >
          <Image
            source={{
              uri: item.author?.image || "https://via.placeholder.com/40",
            }}
            className="w-10 h-10 rounded-full mr-3 bg-gray-100"
          />
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-0.5">
              <View className="flex-row items-baseline gap-1.5">
                <Text className="font-bold text-[15px] text-gray-900">
                  {item.author?.name || "User"}
                </Text>
                <Text className="text-gray-500 text-[13.5px]">
                  @{item.author?.username || item.author?.name?.toLowerCase().replace(/\s+/g, "")}
                </Text>
                <Text className="text-gray-400 text-[13px] ml-1">
                  ·{" "}
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => onOptions(item)}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {isDeepReply && item.parent?.author && (
              <Text className="text-[#1d9bf0] text-[13.5px] mb-1">
                Replying to @{item.parent.author.username || item.parent.author.name}
              </Text>
            )}

            <Text className="text-[15px] leading-6 text-gray-800">
              {(() => {
                if (item.isDeleted) return <Text className="italic text-gray-500">[Deleted]</Text>;
                if (!item.content) return null;
                const parts = item.content.split(/(#[a-zA-Z0-9_]+)/g);
                return parts.map((part: string, i: number) => {
                  if (part.startsWith("#")) {
                    return (
                      <Text
                        key={i}
                        className="text-[#1d9bf0]"
                        onPress={() =>
                          router.push(`/explore?q=${encodeURIComponent(part)}`)
                        }
                      >
                        {part}
                      </Text>
                    );
                  }
                  return <Text key={i}>{part}</Text>;
                });
              })()}
            </Text>

            {/* Images */}
            {(() => {
              if (item.isDeleted) return null;
              const imgs = item.images?.length ? item.images : item.image ? [item.image] : [];
              if (imgs.length === 0) return null;
              if (imgs.length === 1) {
                return (
                  <Image
                    source={{ uri: imgs[0] }}
                    className="w-full h-48 rounded-2xl mt-3 border border-gray-100"
                    resizeMode="cover"
                  />
                );
              }
              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-3 flex-row"
                >
                  {imgs.map((uri: string, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      className="w-64 h-48 rounded-2xl mr-3 border border-gray-100 bg-gray-50"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              );
            })()}

            <View className="flex-row mt-3 items-center justify-between pr-4">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onReply(item.id, item.author?.username || item.author?.name)}
              >
                <Ionicons name="chatbubble-outline" size={17} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {item._count?.replies ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={handleRepost}
              >
                <Ionicons
                  name="repeat-outline"
                  size={18}
                  color={hasReposted ? "#00BA7C" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasReposted ? "text-[#00BA7C]" : "text-gray-500"}`}
                >
                  {item._count?.reposts ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={handleLike}
              >
                <Ionicons
                  name={hasLiked ? "heart" : "heart-outline"}
                  size={18}
                  color={hasLiked ? "#F91880" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
                >
                  {item._count?.likes ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center">
                <Ionicons
                  name="stats-chart-outline"
                  size={17}
                  color="#6B7280"
                />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {item.viewCount ?? item.views ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Nested replies */}
        {item.replies && item.replies.length > 0 && (
          <View>
            {item.replies.map((reply: any) => (
              <ReplyItem
                key={reply.id}
                item={reply}
                currentUserId={currentUserId}
                onReply={onReply}
                onOptions={onOptions}
              />
            ))}
          </View>
        )}
      </View>
    );
  },
);

ReplyItem.displayName = "ReplyItem";

// ────────────────────────────────────────────────
// Main Post Detail Screen
// ────────────────────────────────────────────────
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: any) => state.auth.user);

  const [replyContent, setReplyContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null); // Post

  const inputRef = useRef<TextInput>(null);

  const { data: threadData, isLoading: threadLoading, refetch: refetchThread } = useGetThreadQuery(id!, {
    skip: !id,
  });

  const [replyPost] = useReplyPostMutation();
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [deletePost] = useDeletePostMutation();
  const [incrementViewCount] = useIncrementViewCountMutation();
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();

  const { rootPost, topLevelReplies } = useMemo(() => {
    if (!threadData || !Array.isArray(threadData) || threadData.length === 0) return { rootPost: null, topLevelReplies: [] };
    return buildThreadTree(threadData, id!);
  }, [threadData, id]);

  // Auto-increment view count once
  React.useEffect(() => {
    if (id) {
      incrementViewCount({ postId: id }).catch(() => {});
    }
  }, [id, incrementViewCount]);

  const handleSendReply = useCallback(async () => {
    if (!replyContent.trim() || !id) return;

    const content = replyContent.trim();
    // Use replyToId if a child node was selected, otherwise route to main post ID
    const targetPostId = replyToId || id;

    setReplyContent("");
    setReplyToId(null);
    setReplyTargetName(null);

    try {
      await replyPost({
        postId: targetPostId,
        content,
      }).unwrap();
      refetchThread();
    } catch (err) {
      console.error("Reply failed", err);
    }
  }, [replyContent, id, replyToId, replyPost, refetchThread]);

  const handleReplyIntent = useCallback((postId: string, username: string) => {
    setReplyToId(postId);
    setReplyTargetName(username);
    setReplyContent("");
    inputRef.current?.focus();
  }, []);

  const handleOptions = useCallback((item: any) => {
    setSelectedItem(item);
    setOptionsVisible(true);
  }, []);

  const handleFollow = useCallback(async () => {
    if (!rootPost?.author?.id) return;
    try {
      await followUser(rootPost.author.id).unwrap();
    } catch (err) {
      console.error("Follow failed", err);
    }
  }, [rootPost?.author?.id, followUser]);

  const hasLiked = rootPost?.isLiked ?? false;
  const hasReposted = rootPost?.repostedByMe ?? false;
  const isBookmarked = rootPost?.isBookmarked ?? false;

  const handlePostShare = useCallback(async () => {
    try {
      if(!rootPost) return;
      const urlToShare = `https://oasis-social.com/post/${rootPost.id}`;
      await Share.share({
        message: `Check out this post by @${rootPost.author?.username || rootPost.author?.name}: "${rootPost.content}"\n${urlToShare}`,
      });
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  }, [rootPost]);

  const handlePostRepost = useCallback(async () => {
    if(!rootPost) return;
    try {
      await repostPost({ id: rootPost.id }).unwrap();
    } catch (err) {
      console.error("Repost failed", err);
    }
  }, [rootPost, repostPost]);

  if (threadLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  if (!rootPost) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500 text-lg">Post not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">Post</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <FlatList
          data={topLevelReplies}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReplyItem
              item={item}
              currentUserId={currentUser?.id}
              onReply={handleReplyIntent}
              onOptions={handleOptions}
            />
          )}
          ListHeaderComponent={
            <View className="p-4 bg-white border-b border-gray-100">
              {/* Parent context link if this is a standalone reply viewed directly */}
              {rootPost.replyToId && (
                <TouchableOpacity
                  className="mb-3"
                  onPress={() => router.push(`/post/${rootPost.replyToId}`)}
                >
                  <Text className="text-[#1d9bf0] text-[13.5px] font-medium">Show parent thread</Text>
                </TouchableOpacity>
              )}

              {/* Author row */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center">
                  <Image
                    source={{
                      uri:
                        rootPost.author?.image || "https://via.placeholder.com/48",
                    }}
                    className="w-12 h-12 rounded-full mr-3 bg-gray-100"
                  />
                  <View>
                    <Text className="font-bold text-[16px] text-gray-900">
                      {rootPost.author?.name || "User"}
                    </Text>
                    <Text className="text-gray-500 text-[14.5px]">
                      @
                      {rootPost.author?.username ||
                        rootPost.author?.name?.toLowerCase().replace(/\s+/g, "")}
                    </Text>
                  </View>
                </View>

                {rootPost.author?.id !== currentUser?.id && (
                  <TouchableOpacity
                    className={`border px-5 py-1.5 rounded-full ${
                      isFollowing
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300"
                    }`}
                    onPress={handleFollow}
                    disabled={isFollowing}
                  >
                    <Text className="font-semibold text-[14.5px] text-gray-800">
                      {isFollowing ? "Following..." : "Follow"}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {rootPost.author?.id === currentUser?.id && (
                  <TouchableOpacity
                  onPress={() => {
                    setSelectedItem(rootPost);
                    setOptionsVisible(true);
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
                </TouchableOpacity>
                )}
              </View>

              {/* Content */}
              <Text className="text-[17px] leading-6 text-gray-900 mb-4">
                {(() => {
                  if (rootPost.isDeleted) return <Text className="italic text-gray-500">[Deleted]</Text>;
                  if (!rootPost.content) return null;
                  const parts = rootPost.content.split(/(#[a-zA-Z0-9_]+)/g);
                  return parts.map((part: any, i: any) => {
                    if (part.startsWith("#")) {
                      return (
                        <Text
                          key={i}
                          className="text-[#1d9bf0]"
                          onPress={() =>
                            router.push(
                              `/explore?q=${encodeURIComponent(part)}`,
                            )
                          }
                        >
                          {part}
                        </Text>
                      );
                    }
                    return <Text key={i}>{part}</Text>;
                  });
                })()}
              </Text>

              {/* Images */}
              {(() => {
                if (rootPost.isDeleted) return null;
                const imgs = rootPost.images?.length
                  ? rootPost.images
                  : rootPost.image
                    ? [rootPost.image]
                    : [];
                if (imgs.length === 0) return null;

                if (imgs.length === 1) {
                  return (
                    <Image
                      source={{ uri: imgs[0] }}
                      className="w-full h-72 rounded-2xl mb-5 border border-gray-100"
                      resizeMode="cover"
                    />
                  );
                }

                return (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-5 flex-row"
                  >
                    {imgs.map((uri: string, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri }}
                        className="w-80 h-72 rounded-2xl mr-3 border border-gray-100 bg-gray-50"
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                );
              })()}

              {/* Timestamp + views */}
              <View className="flex-row items-center py-2.5 border-y border-gray-100 mb-2">
                <Text className="text-gray-600 text-[15px]">
                  {new Date(rootPost.createdAt).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  ·{" "}
                  {new Date(rootPost.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {rootPost.viewCount ?? rootPost.views ?? 0} Views
                </Text>
              </View>

              {/* Action bar */}
              <View className="flex-row justify-between items-center py-2 px-2">
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color="#6B7280"
                  />
                  <Text className="text-gray-600 text-[15px] ml-2">
                    {rootPost._count?.replies ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={handlePostRepost}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={24}
                    color={hasReposted ? "#00BA7C" : "#6B7280"}
                  />
                  <Text
                    className={`text-[15px] ml-2 ${hasReposted ? "text-[#00BA7C]" : "text-gray-600"}`}
                  >
                    {rootPost._count?.reposts ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => likePost({ postId: rootPost.id })}
                >
                  <Ionicons
                    name={hasLiked ? "heart" : "heart-outline"}
                    size={23}
                    color={hasLiked ? "#F91880" : "#6B7280"}
                  />
                  <Text
                    className={`text-[15px] ml-2 ${hasLiked ? "text-[#F91880] font-medium" : "text-gray-600"}`}
                  >
                    {rootPost._count?.likes ?? 0}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row items-center">
                  <Ionicons
                    name="stats-chart-outline"
                    size={22}
                    color="#6B7280"
                  />
                  <Text className="text-gray-600 text-[15px] ml-2">
                    {rootPost.viewCount ?? rootPost.views ?? 0}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => bookmarkPost(rootPost.id)}>
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={23}
                    color={isBookmarked ? "#1d9bf0" : "#6B7280"}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePostShare}>
                  <Ionicons name="share-outline" size={23} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-gray-500 text-base">
                No replies yet • Be the first!
              </Text>
            </View>
          }
        />

        {/* Reply input area */}
        <View className="border-t border-gray-100 bg-white">
          {replyToId && (
            <View className="flex-row items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <Text className="text-gray-600 text-[14.5px]">
                Replying to{" "}
                <Text className="text-[#1d9bf0]">@{replyTargetName}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyToId(null);
                  setReplyTargetName(null);
                }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center px-3 py-3">
            <Image
              source={{
                uri: currentUser?.image || "https://via.placeholder.com/40",
              }}
              className="w-10 h-10 rounded-full mr-3 bg-gray-100"
            />
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5">
              <TextInput
                ref={inputRef}
                placeholder="Post your reply..."
                placeholderTextColor="#9CA3AF"
                value={replyContent}
                onChangeText={setReplyContent}
                multiline
                className="text-[16px] text-gray-900 max-h-24"
              />
            </View>
            <TouchableOpacity
              onPress={handleSendReply}
              disabled={!replyContent.trim()}
              className={`ml-3 px-5 py-2.5 rounded-full ${
                replyContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"
              }`}
            >
              <Text className="text-white font-bold text-[15px]">Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <PostOptionsModal
        isVisible={optionsVisible}
        onClose={() => {
          setOptionsVisible(false);
          setSelectedItem(null);
        }}
        isOwner={
          selectedItem?.author?.id === currentUser?.id
        }
        onDelete={async () => {
          if (!selectedItem) return;
          try {
            await deletePost({ id: selectedItem.id }).unwrap();
            if (selectedItem.id === id) {
              router.back();
            } else {
              refetchThread();
            }
          } catch (e) {
            console.error("Delete failed", e);
            alert("Failed to delete post");
          }
          setOptionsVisible(false);
          setSelectedItem(null);
        }}
        onReport={() => {
          alert("Reported");
          setOptionsVisible(false);
        }}
        onBlock={() => {
          alert("Blocked");
          setOptionsVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
