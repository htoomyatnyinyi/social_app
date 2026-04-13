import { useFollowUserMutation } from "@/store/profileApi";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";
import PostOptionsModal from "../../components/PostOptionsModal";
import {
  useBookmarkPostMutation,
  useDeletePostMutation,
  useGetThreadQuery,
  useIncrementViewCountMutation,
  useLikePostMutation,
  useReplyPostMutation,
  useRepostPostMutation,
} from "../../store/postApi";
import * as Haptics from "expo-haptics";

// ────────────────────────────────────────────────
// Tree Builder helper
// ────────────────────────────────────────────────
function buildThreadTree(posts: any[], rootId: string) {
  if (!posts || !rootId) return { rootPost: null, flatReplies: [] };

  const map = new Map<string, any>();
  posts.forEach((p) => {
    if (p && p.id) {
      map.set(String(p.id), { ...p, children: [] });
    }
  });

  const targetId = String(rootId);
  map.forEach((p) => {
    if (String(p.id) === targetId) return;
    if (p.replyToId && map.has(String(p.replyToId))) {
      const parent = map.get(String(p.replyToId));
      p.parent = parent;
      parent.children.push(p);
    }
  });

  map.forEach((p) => {
    if (p.children && p.children.length > 0) {
      p.children.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
  });

  const flatReplies: any[] = [];
  const rootNode = map.get(targetId);

  function dfs(node: any, depth: number) {
    if (!node) return;
    flatReplies.push({ ...node, depth });
    if (node.children) {
      for (const child of node.children) {
        dfs(child, depth + 1);
      }
    }
  }

  if (rootNode && rootNode.children) {
    for (const child of rootNode.children) {
      dfs(child, 0);
    }
  }

  return { rootPost: rootNode, flatReplies };
}

// ────────────────────────────────────────────────
// Action Button Helper
// ────────────────────────────────────────────────
const ActionButton = memo(
  ({
    icon,
    count,
    active,
    activeColor,
    onPress,
    activeBg,
    size = 18,
  }: {
    icon: string;
    count?: number;
    active?: boolean;
    activeColor: string;
    onPress: () => void;
    activeBg: string;
    size?: number;
  }) => (
    <TouchableOpacity
      className={`flex-row items-center px-3 py-2 rounded-2xl ${active ? activeBg : "bg-gray-100/50 dark:bg-slate-800/50"}`}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={size}
        color={active ? activeColor : "#64748B"}
      />
      {count !== undefined && (
        <Text
          className={`text-[12px] font-black ml-1.5 ${active ? "" : "text-gray-500 dark:text-slate-500"}`}
          style={active ? { color: activeColor } : {}}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  ),
);

ActionButton.displayName = "ActionButton";

// ────────────────────────────────────────────────
// Memoized Reply Item
// ────────────────────────────────────────────────
const ReplyItem = memo(
  ({
    item,
    onReply,
    onOptions,
    threadId,
  }: {
    item: any;
    onReply: (postId: string, username: string) => void;
    onOptions: (item: any) => void;
    threadId?: string;
  }) => {
    const replyDepth = item.depth || 0;
    const isDeepReply = replyDepth > 0;
    const indentLevel = Math.min(replyDepth, 4);

    const [likePost] = useLikePostMutation();
    const [repostPost] = useRepostPostMutation();

    const handleLike = useCallback(async () => {
      if (!item.isLiked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await likePost({ postId: item.id, threadId }).unwrap();
      } catch (err) {
        console.error("Failed to like reply:", err);
      }
    }, [likePost, item.id, item.isLiked, threadId]);

    const handleRepost = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await repostPost({ id: item.id, threadId }).unwrap();
      } catch (err) {
        console.error("Failed to repost reply:", err);
      }
    }, [repostPost, item.id, threadId]);

    const handleShare = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const urlToShare = `https://social-app.com/post/${item.id}`;
        await Share.share({
          message: `Check out this post by @${item.author?.username || "official"}\n${urlToShare}`,
        });
      } catch (error) {
        console.error("Error sharing reply:", error);
      }
    }, [item]);

    const hasLiked = item.isLiked ?? false;
    const hasReposted = item.repostedByMe ?? false;

    return (
      <View
        style={isDeepReply ? { marginLeft: indentLevel * 16 } : undefined}
        className={`${isDeepReply ? "border-l-2 border-sky-100 dark:border-slate-700 pl-3" : "border-b border-gray-50 dark:border-slate-800/50"} bg-[#F8FAFC] dark:bg-[#0F172A]`}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/post/${item.id}`);
          }}
          className="flex-row p-4"
        >
          <Image
            source={{
              uri:
                item.author?.image ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${item.author?.id}`,
            }}
            className="w-10 h-10 rounded-2xl mr-3 bg-white dark:bg-slate-800 shadow-sm"
            contentFit="cover"
            transition={300}
          />
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-0.5">
              <View className="flex-row items-center">
                <Text className="font-black text-[14px] text-gray-900 dark:text-white tracking-tight">
                  {item.author?.name || "Member"}
                </Text>
                <Text className="text-sky-500 font-bold text-[11px] ml-2 uppercase tracking-widest">
                  @{item.author?.username}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onOptions(item)}
                className="w-8 h-8 items-center justify-center rounded-xl bg-gray-50/50 dark:bg-slate-800/50"
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {isDeepReply && item.parent?.author && (
              <View className="bg-sky-50/50 dark:bg-sky-500/10 self-start px-2 py-0.5 rounded-lg mb-1">
                <Text className="text-sky-600 dark:text-sky-400 font-bold text-[11px]">
                  Replying to @{item.parent.author.username}
                </Text>
              </View>
            )}

            <Text className="text-[15px] leading-[22px] text-gray-800 dark:text-slate-300 font-medium">
              {(() => {
                if (item.isDeleted)
                  return (
                    <Text className="italic text-gray-400 dark:text-slate-500 font-medium">
                      [Post Deleted]
                    </Text>
                  );
                if (!item.content) return null;
                const parts = item.content.split(/(#[a-zA-Z0-9_]+)/g);
                return parts.map((part: string, i: number) => {
                  if (part.startsWith("#")) {
                    return (
                      <Text
                        key={i}
                        className="text-sky-500 font-black"
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

            {/* Media Gallery for Reply */}
            <View className="mt-3">
              {(() => {
                if (item.isDeleted) return null;
                const imgs = item.images?.length
                  ? item.images
                  : item.image
                    ? [item.image]
                    : [];
                if (imgs.length === 0) return null;
                if (imgs.length === 1) {
                  return (
                    <Image
                      source={{ uri: imgs[0] }}
                      className="w-full h-48 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800"
                      contentFit="cover"
                      transition={400}
                    />
                  );
                }
                return (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row"
                    snapToInterval={220}
                    decelerationRate="fast"
                  >
                    {imgs.map((uri: string, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri }}
                        className="w-56 h-48 rounded-2xl mr-3 border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800"
                        contentFit="cover"
                        transition={400}
                      />
                    ))}
                  </ScrollView>
                );
              })()}
            </View>

            <View className="flex-row mt-4 items-center justify-between">
              <ActionButton
                icon="chatbubble-outline"
                count={item._count?.replies}
                activeColor="#64748B"
                activeBg="bg-gray-100 dark:bg-slate-800"
                onPress={() =>
                  onReply(item.id, item.author?.username || item.author?.name)
                }
                size={16}
              />
              <ActionButton
                icon="repeat"
                count={item._count?.reposts}
                active={hasReposted}
                activeColor="#10B981"
                activeBg="bg-emerald-50 dark:bg-emerald-500/10"
                onPress={handleRepost}
                size={16}
              />
              <ActionButton
                icon={hasLiked ? "heart" : "heart-outline"}
                count={item._count?.likes}
                active={hasLiked}
                activeColor="#F43F5E"
                activeBg="bg-rose-50 dark:bg-rose-500/10"
                onPress={handleLike}
                size={16}
              />
              <TouchableOpacity
                onPress={handleShare}
                className="w-8 h-8 items-center justify-center rounded-xl bg-gray-50/50 dark:bg-slate-800/50"
              >
                <Ionicons name="share-outline" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const currentUser = useSelector((state: any) => state.auth.user);

  const [replyContent, setReplyContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const inputRef = useRef<TextInput>(null);

  const {
    data: threadData,
    isLoading: threadLoading,
    refetch: refetchThread,
  } = useGetThreadQuery(id!, {
    skip: !id,
  });

  const [replyPost] = useReplyPostMutation();
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [deletePost] = useDeletePostMutation();
  const [incrementViewCount] = useIncrementViewCountMutation();
  const [followUser, { isLoading: isFollowingMutation }] =
    useFollowUserMutation();

  const { rootPost, flatReplies } = useMemo(() => {
    if (!threadData || !Array.isArray(threadData) || threadData.length === 0)
      return { rootPost: null, flatReplies: [] };
    return buildThreadTree(threadData, id!);
  }, [threadData, id]);

  useEffect(() => {
    if (id) {
      incrementViewCount({ postId: id }).catch(() => {});
    }
  }, [id, incrementViewCount]);

  const handleSendReply = useCallback(async () => {
    if (!replyContent.trim() || !id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const content = replyContent.trim();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await followUser(rootPost.author.id).unwrap();
    } catch (err) {
      console.error("Follow failed", err);
    }
  }, [rootPost?.author?.id, followUser]);

  const hasLiked = rootPost?.isLiked ?? false;
  const hasReposted = rootPost?.repostedByMe ?? false;
  const isBookmarked = rootPost?.isBookmarked ?? false;

  const handlePostLike = useCallback(async () => {
    if (!hasLiked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await likePost({ postId: rootPost.id, threadId: id }).unwrap();
    } catch (err) {
      console.error("Like failed", err);
    }
  }, [likePost, rootPost?.id, hasLiked, id]);

  const handlePostRepost = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!rootPost) return;
    try {
      await repostPost({ id: rootPost.id, threadId: id }).unwrap();
    } catch (err) {
      console.error("Repost failed", err);
    }
  }, [rootPost, repostPost, id]);

  const handlePostBookmark = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!rootPost || !id) return;
    try {
      await bookmarkPost({ id: rootPost.id, threadId: id }).unwrap();
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  }, [rootPost, bookmarkPost, id]);

  const handlePostShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (!rootPost) return;
      const urlToShare = `https://server.myanmarsocial.ccwu.cc/posts/${rootPost.id}`;
      await Share.share({
        message: `Check out this post by @${rootPost.author?.username || "official"}\n${urlToShare}`,
      });
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  }, [rootPost]);

  if (threadLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!rootPost) {
    return (
      <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] justify-center items-center px-10">
        <View className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-[40px] items-center justify-center mb-6">
          <Ionicons name="search-outline" size={40} color="#CBD5E1" />
        </View>
        <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase text-center">
          Post Not Found
        </Text>
        <Text className="text-gray-400 dark:text-slate-400 text-center mt-2 font-medium">
          This post seems to have been removed or lost.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 px-8 py-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-200 dark:shadow-none"
        >
          <Text className="text-white font-black uppercase tracking-widest text-xs">
            Return Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Premium Sticky Header */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        className="flex-row items-center px-5 py-4 border-b border-gray-100/50 dark:border-slate-800/50 z-50"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm"
        >
          <Ionicons name="chevron-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <Text className="text-xl font-black ml-4 text-gray-900 dark:text-white tracking-tighter uppercase">
          Post
        </Text>
      </BlurView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={flatReplies}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReplyItem
              item={item}
              onReply={handleReplyIntent}
              onOptions={handleOptions}
              threadId={id}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          ListHeaderComponent={
            <View className="p-5 bg-white dark:bg-[#0F172A] border-b border-gray-100 dark:border-slate-800 rounded-b-[48px] shadow-sm shadow-gray-100">
              {/* Context Link */}
              {rootPost.replyToId && (
                <TouchableOpacity
                  className="mb-4 bg-sky-50 dark:bg-sky-500/10 self-start px-3 py-1.5 rounded-xl border border-sky-100/50 dark:border-sky-500/20"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/post/${rootPost.replyToId}`);
                  }}
                >
                  <Text className="text-sky-600 dark:text-sky-400 text-[12px] font-black uppercase tracking-wider">
                    Show Parent Post
                  </Text>
                </TouchableOpacity>
              )}

              {/* Author Section */}
              <View className="flex-row items-start justify-between mb-5">
                <TouchableOpacity
                  onPress={() => router.push(`/profile/${rootPost.author?.id}`)}
                  className="flex-row items-center flex-1"
                >
                  <Image
                    source={{
                      uri:
                        rootPost.author?.image ||
                        `https://api.dicebear.com/7.x/avataaars/png?seed=${rootPost.author?.id}`,
                    }}
                    className="w-14 h-14 rounded-[22px] mr-4 bg-white dark:bg-slate-800 shadow-md shadow-sky-100 dark:shadow-none"
                    contentFit="cover"
                    transition={300}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-black text-[18px] text-gray-900 dark:text-white tracking-tighter">
                        {rootPost.author?.name || "Member"}
                      </Text>
                      {rootPost.author?.username === "official" && (
                        <Ionicons
                          name="checkmark-sharp"
                          size={18}
                          color="#0EA5E9"
                          className="ml-1"
                        />
                      )}
                    </View>
                    <Text className="text-sky-500 font-bold text-[14px]">
                      @{rootPost.author?.username || "official"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View className="flex-row items-center space-x-2">
                  {rootPost.author?.id !== currentUser?.id && (
                    <TouchableOpacity
                      className={`px-6 py-2.5 rounded-2xl shadow-sm ${
                        rootPost.isFollowing
                          ? "bg-white border border-gray-100"
                          : "bg-sky-500 shadow-sky-200"
                      }`}
                      onPress={handleFollow}
                      disabled={isFollowingMutation}
                    >
                      <Text
                        className={`font-black uppercase tracking-wider text-[11px] ${rootPost.isFollowing ? "text-gray-400" : "text-white"}`}
                      >
                        {rootPost.isFollowing ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedItem(rootPost);
                      setOptionsVisible(true);
                    }}
                    className="w-10 h-10 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100"
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content Body */}
              <Text className="text-[18px] leading-7 text-gray-900 dark:text-white font-medium mb-5">
                {(() => {
                  if (rootPost.isDeleted)
                    return (
                      <Text className="italic text-gray-400 dark:text-slate-500">
                        [Post Deleted]
                      </Text>
                    );
                  if (!rootPost.content) return null;
                  const parts = rootPost.content.split(/(#[a-zA-Z0-9_]+)/g);
                  return parts.map((part: any, i: any) =>
                    part.startsWith("#") ? (
                      <Text
                        key={i}
                        className="text-sky-500 font-black"
                        onPress={() =>
                          router.push(`/explore?q=${encodeURIComponent(part)}`)
                        }
                      >
                        {part}
                      </Text>
                    ) : (
                      <Text key={i}>{part}</Text>
                    ),
                  );
                })()}
              </Text>

              {/* Visual Media Gallery */}
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
                      className="w-full h-80 rounded-[40px] mb-6 border border-gray-50 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 shadow-lg shadow-gray-100 dark:shadow-none"
                      contentFit="cover"
                      transition={400}
                    />
                  );
                }

                return (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-6 flex-row"
                    snapToInterval={Platform.OS === "ios" ? 312 : 320}
                    decelerationRate="fast"
                  >
                    {imgs.map((uri: string, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri }}
                        className="w-72 h-80 rounded-[40px] mr-4 border border-gray-50 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 shadow-md shadow-gray-100 dark:shadow-none"
                        contentFit="cover"
                        transition={400}
                      />
                    ))}
                  </ScrollView>
                );
              })()}

              {/* Timestamp & Metrics */}
              <View className="py-4 border-y border-gray-100/80 dark:border-slate-800/80 mb-4 px-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#94A3B8"
                    />
                    <Text className="text-gray-400 dark:text-slate-500 font-bold uppercase text-[11px] ml-2 tracking-widest">
                      {new Date(rootPost.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="stats-chart" size={14} color="#10B981" />
                    <Text className="text-emerald-500 font-black text-[11px] ml-1.5 uppercase tracking-widest">
                      {rootPost.viewCount ?? rootPost.views ?? 0} Views
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-between items-center px-1">
                <ActionButton
                  icon="chatbubble-outline"
                  count={rootPost._count?.replies}
                  activeColor="#64748B"
                  activeBg="bg-gray-100 dark:bg-slate-800"
                  onPress={() => inputRef.current?.focus()}
                  size={22}
                />

                <ActionButton
                  icon="repeat"
                  count={rootPost._count?.reposts}
                  active={hasReposted}
                  activeColor="#10B981"
                  activeBg="bg-emerald-50 dark:bg-emerald-500/10"
                  onPress={handlePostRepost}
                  size={24}
                />

                <ActionButton
                  icon={hasLiked ? "heart" : "heart-outline"}
                  count={rootPost._count?.likes}
                  active={hasLiked}
                  activeColor="#F43F5E"
                  activeBg="bg-rose-50 dark:bg-rose-500/10"
                  onPress={handlePostLike}
                  size={24}
                />

                <ActionButton
                  icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                  active={isBookmarked}
                  activeColor="#0EA5E9"
                  activeBg="bg-sky-50 dark:bg-sky-500/10"
                  onPress={handlePostBookmark}
                  size={22}
                />

                {/* <TouchableOpacity
                  onPress={handlePostShare}
                  className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50/50 dark:bg-slate-800/50"
                >
                  <Ionicons name="share-outline" size={22} color="#64748B" />
                </TouchableOpacity> */}
              </View>
            </View>
          }
        />

        {/* Floating Reply Input */}
        <BlurView
          intensity={95}
          tint={isDark ? "dark" : "light"}
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          className="px-5 pt-3 border-t border-gray-100/50 dark:border-slate-800/50"
        >
          {replyToId && (
            <View className="flex-row items-center mb-2 bg-sky-50/80 dark:bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-100 dark:border-sky-500/20">
              <Text className="text-[11px] font-bold text-sky-600 flex-1">
                Replying to{" "}
                <Text className="font-black">@{replyTargetName}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyToId(null);
                  setReplyTargetName(null);
                }}
              >
                <Ionicons name="close-circle" size={16} color="#0EA5E9" />
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center bg-gray-50/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-[28px] px-5 py-2">
            <TextInput
              ref={inputRef}
              className="flex-1 text-[16px] text-gray-900 dark:text-white font-medium py-1"
              placeholder={
                replyToId
                  ? `Reply to @${replyTargetName}...`
                  : "Write your reply..."
              }
              placeholderTextColor="#94A3B8"
              value={replyContent}
              onChangeText={setReplyContent}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendReply}
              disabled={!replyContent.trim()}
              className="w-10 h-10 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: replyContent.trim() ? "#0ea5e9" : "#e5e7eb",
              }}
            >
              <Ionicons name="arrow-up" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </KeyboardAvoidingView>

      <PostOptionsModal
        isVisible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        isOwner={selectedItem?.author?.id === currentUser?.id}
        onDelete={async () => {
          if (!selectedItem?.id) return;
          try {
            await deletePost({ id: selectedItem.id }).unwrap();
            setOptionsVisible(false);
            if (selectedItem.id === id) router.back();
            else refetchThread();
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
      />
    </View>
  );
}
