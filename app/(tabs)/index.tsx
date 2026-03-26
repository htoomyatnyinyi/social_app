import React, { useState, useMemo, useCallback } from "react";
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
  ScrollView,
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

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  username?: string;
  image?: string;
}

interface Post {
  id: string;
  content: string;
  image?: string;
  images?: string[];
  createdAt: string;
  author: User;
  authorId?: string;
  isRepost?: boolean;
  originalPost?: Post;
  // Computed booleans from backend
  isLiked?: boolean;
  isBookmarked?: boolean;
  repostedByMe?: boolean;
  isAuthor?: boolean;
  hasMoreReplies?: boolean;
  isDeleted?: boolean;
  _count: {
    replies: number;
    reposts: number;
    likes: number;
    quotes: number;
  };
  viewCount?: number;
  repostsCount?: number;
  previewReplies?: Post[];
}

// ────────────────────────────────────────────────
// Post Card (Memoized)
// ────────────────────────────────────────────────
interface PostCardProps {
  item: Post;
  user: User | null;
  onPressPost: (postId: string) => void;
  onPressProfile: (authorId: string) => void;
  onPressOptions: (post: Post) => void;
  onPressComment: (postId: string) => void;
  onPressRepost: (post: Post) => void;
  onLike: (postId: string) => Promise<void>;
  onBookmark: (postId: string) => Promise<void>;
}

// Memoized PostCard component with improved props
const PostCard = React.memo(
  ({
    item,
    user,
    onPressPost,
    onPressProfile,
    onPressOptions,
    onPressComment,
    onPressRepost,
    onLike,
    onBookmark,
  }: PostCardProps) => {
    const router = useRouter();
    // State for handling "See more" text expansion
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSeeMore, setShowSeeMore] = useState(false);

    const isRepost = !!item.isRepost || !!item.repostedByMe;
    const displayPost =
      isRepost && item.originalPost ? item.originalPost : item;

    const displayAuthor = displayPost.author;
    const displayId = displayPost.id;

    const hasLiked = displayPost.isLiked ?? false;

    const isBookmarked = displayPost.isBookmarked ?? false;

    const hasReposted = item.repostedByMe ?? false;

    const createdAtFormatted = useMemo(() => {
      if (!displayPost.createdAt) return "";
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(displayPost.createdAt));
    }, [displayPost.createdAt]);

    // Check text layout to determine if "See more" is needed
    const handleTextLayout = useCallback(
      (e: any) => {
        if (!showSeeMore && e.nativeEvent.lines.length > 5) {
          setShowSeeMore(true);
        }
      },
      [showSeeMore],
    );

    if (!displayPost) return null;

    const renderContent = (text: string) => {
      if (!text) return null;
      const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
      return (
        <Text
          className="text-[15px] leading-6 text-gray-800"
          numberOfLines={isExpanded ? undefined : showSeeMore ? 5 : undefined}
          onTextLayout={handleTextLayout}
        >
          {parts.map((part, i) => {
            if (part.startsWith("#")) {
              return (
                <Text
                  key={i}
                  className="text-[#1D9BF0]"
                  onPress={() =>
                    router.push(`/explore?q=${encodeURIComponent(part)}`)
                  }
                >
                  {part}
                </Text>
              );
            }
            return <Text key={i}>{part}</Text>;
          })}
        </Text>
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onPressPost(displayId)}
        className="bg-white border-b border-gray-100/80 px-4 pt-4 pb-2"
      >
        {/* Repost header */}
        {isRepost && item.author && (
          <View className="flex-row items-center mb-2 ml-14">
            <Ionicons name="repeat" size={16} color="#6B7280" />
            <Text className="ml-2 text-xs font-semibold text-gray-500">
              {item.author.name} reposted
            </Text>
          </View>
        )}

        <View className="flex-row">
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => displayAuthor.id && onPressProfile(displayAuthor.id)}
          >
            <Image
              source={{
                uri: displayAuthor.image || "https://via.placeholder.com/48",
              }}
              className="w-12 h-12 rounded-full bg-gray-100 mr-3"
            />
          </TouchableOpacity>

          <View className="flex-1">
            {/* Name + username + time + options */}
            <View className="flex-row items-center mb-0.5">
              <Text
                className="font-bold text-[15px] text-gray-900 flex-shrink"
                numberOfLines={1}
              >
                {displayAuthor.name || "User"}
              </Text>
              <Text className="text-gray-500 text-[13.5px] ml-1.5">
                @{displayAuthor.username || "user"} · {createdAtFormatted}
              </Text>
              <TouchableOpacity
                className="ml-auto p-1.5"
                onPress={() => onPressOptions(item)}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Content with See More Logic */}
            <View className="mb-3">
              {renderContent(displayPost.content)}

              {/* See More Button */}
              {showSeeMore && !isExpanded && (
                <TouchableOpacity
                  onPress={() => setIsExpanded(true)}
                  className="mt-1"
                >
                  <Text className="text-[#1D9BF0] text-[15px]">See more</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Images */}
            {(() => {
              const imgs = displayPost.images?.length
                ? displayPost.images
                : displayPost.image
                  ? [displayPost.image]
                  : [];
              if (imgs.length === 0) return null;

              if (imgs.length === 1) {
                return (
                  <Image
                    source={{ uri: imgs[0] }}
                    className="w-full h-56 rounded-2xl mb-3 border border-gray-100 bg-gray-50"
                    resizeMode="cover"
                  />
                );
              }

              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3 flex-row"
                >
                  {imgs.map((uri: string, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      className="w-64 h-56 rounded-2xl border border-gray-100 bg-gray-50 mr-2"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              );
            })()}

            {/* Action row */}
            <View className="flex-row justify-between items-center pr-2 mt-1">
              {/* Comment */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onPressComment(displayId)}
              >
                <Ionicons name="chatbubble-outline" size={19} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {displayPost._count?.replies ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Repost */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onPressRepost(item)}
              >
                <Ionicons
                  name="repeat-outline"
                  size={21}
                  color={hasReposted ? "#00BA7C" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasReposted ? "text-[#00BA7C] font-medium" : "text-gray-500"}`}
                >
                  {item.repostsCount ?? displayPost._count?.reposts ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Like */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onLike(displayId)}
              >
                <Ionicons
                  name={hasLiked ? "heart" : "heart-outline"}
                  size={20}
                  color={hasLiked ? "#F91880" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880] font-medium" : "text-gray-500"}`}
                >
                  {displayPost._count?.likes ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Views */}
              <View className="flex-row items-center">
                <Ionicons
                  name="stats-chart-outline"
                  size={18}
                  color="#6B7280"
                />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {displayPost.viewCount ?? 0}
                </Text>
              </View>

              {/* Bookmark */}
              <TouchableOpacity onPress={() => onBookmark(displayId)}>
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={19}
                  color={isBookmarked ? "#1D9BF0" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>

            {/* Preview Replies  */}
            {/* {displayPost.previewReplies &&
              displayPost.previewReplies.length > 0 && (
                <View className="mt-3 border-t border-gray-100 pt-2 pb-1">
                  {displayPost.previewReplies.map((reply: any) => (
                    <TouchableOpacity
                      key={reply.id}
                      className="flex-row mt-2 items-start"
                      onPress={() => onPressPost(displayId)}
                    >
                      <Image
                        source={{
                          uri:
                            reply.author?.image ||
                            "https://via.placeholder.com/24",
                        }}
                        className="w-6 h-6 rounded-full bg-gray-100 mr-2 mt-0.5"
                      />
                      <View className="flex-1">
                        <Text className="font-bold text-[13px] text-gray-900 leading-tight">
                          {reply.author?.name || "User"}{" "}
                          <Text className="font-normal text-gray-500">
                            @{reply.author?.username || "user"}
                          </Text>
                        </Text>
                        <Text
                          className="text-[13.5px] text-gray-800 leading-tight mt-0.5"
                          numberOfLines={2}
                        >
                          {reply.isDeleted ? "[Deleted]" : reply.content}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {displayPost.hasMoreReplies && (
                    <TouchableOpacity
                      onPress={() => onPressPost(displayId)}
                      className="mt-2.5 ml-8 mb-1"
                    >
                      <Text className="text-[#1D9BF0] text-[13px] font-medium">
                        Show more replies...
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )} */}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

PostCard.displayName = "PostCard";

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
