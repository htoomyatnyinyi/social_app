import React, {
  useState,
  useCallback,
  useRef,
  memo,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import PostOptionsModal from "../../components/PostOptionsModal";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
// import { LinearGradient } from "expo-linear-gradient";
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
const ActionButton = ({
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
    className={`flex-row items-center px-3 py-2 rounded-2xl ${active ? activeBg : "bg-gray-100/50"}`}
    onPress={onPress}
  >
    <Ionicons
      name={icon as any}
      size={size}
      color={active ? activeColor : "#64748B"}
    />
    {count !== undefined && (
      <Text
        className={`text-[12px] font-black ml-1.5 ${active ? activeColor.replace("#", "") : "text-gray-500"}`}
        style={active ? { color: activeColor } : {}}
      >
        {count}
      </Text>
    )}
  </TouchableOpacity>
);

// ────────────────────────────────────────────────
// Memoized Reply Item
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
    const replyDepth = item.depth || 0;
    const isDeepReply = replyDepth > 0;
    const indentLevel = Math.min(replyDepth, 4);

    const [likePost] = useLikePostMutation();
    const [repostPost] = useRepostPostMutation();
    const router = useRouter();

    const handleLike = useCallback(async () => {
      if (!item.isLiked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await likePost({ postId: item.id }).unwrap();
      } catch (err) {
        console.error("Failed to like reply:", err);
      }
    }, [likePost, item.id, item.isLiked]);

    const handleRepost = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await repostPost({ id: item.id }).unwrap();
      } catch (err) {
        console.error("Failed to repost reply:", err);
      }
    }, [repostPost, item.id]);

    const handleShare = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const urlToShare = `https://oasis-social.com/post/${item.id}`;
        await Share.share({
          message: `Oasis Discovery: check out this reply by @${item.author?.username || "oasis"}\n${urlToShare}`,
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
        className={`${isDeepReply ? "border-l-2 border-sky-100 pl-3" : "border-b border-gray-50"} bg-[#F8FAFC]`}
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
            className="w-10 h-10 rounded-2xl mr-3 bg-white shadow-sm"
            contentFit="cover"
            transition={300}
          />
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-0.5">
              <View className="flex-row items-center">
                <Text className="font-black text-[14px] text-gray-900 tracking-tight">
                  {item.author?.name || "Member"}
                </Text>
                <Text className="text-sky-500 font-bold text-[11px] ml-2 uppercase tracking-widest">
                  @{item.author?.username}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onOptions(item)}
                className="w-8 h-8 items-center justify-center rounded-xl bg-gray-50/50"
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {isDeepReply && item.parent?.author && (
              <View className="bg-sky-50/50 self-start px-2 py-0.5 rounded-lg mb-1">
                <Text className="text-sky-600 font-bold text-[11px]">
                  Replying to @{item.parent.author.username}
                </Text>
              </View>
            )}

            <Text className="text-[15px] leading-[22px] text-gray-800 font-medium">
              {(() => {
                if (item.isDeleted)
                  return (
                    <Text className="italic text-gray-400 font-medium">
                      [Artifact Withdrawn]
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

            {/* Reply Images */}
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
                    className="w-full h-48 rounded-2xl mt-3 border border-gray-100 bg-white"
                    contentFit="cover"
                    transition={400}
                  />
                );
              }
              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-3 flex-row"
                  snapToInterval={220}
                  decelerationRate="fast"
                >
                  {imgs.map((uri: string, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      className="w-56 h-48 rounded-2xl mr-3 border border-gray-100 bg-white"
                      contentFit="cover"
                      transition={400}
                    />
                  ))}
                </ScrollView>
              );
            })()}

            <View className="flex-row mt-4 items-center justify-between">
              <ActionButton
                icon="chatbubble-outline"
                count={item._count?.replies}
                activeColor="#64748B"
                activeBg="bg-gray-100"
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
                activeBg="bg-emerald-50"
                onPress={handleRepost}
                size={16}
              />
              <ActionButton
                icon={hasLiked ? "heart" : "heart-outline"}
                count={item._count?.likes}
                active={hasLiked}
                activeColor="#F43F5E"
                activeBg="bg-rose-50"
                onPress={handleLike}
                size={16}
              />
              <TouchableOpacity
                onPress={handleShare}
                className="w-8 h-8 items-center justify-center rounded-xl bg-gray-50/50"
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      await likePost({ postId: rootPost.id }).unwrap();
    } catch (err) {
      console.error("Like failed", err);
    }
  }, [likePost, rootPost?.id, hasLiked]);

  const handlePostRepost = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!rootPost) return;
    try {
      await repostPost({ id: rootPost.id }).unwrap();
    } catch (err) {
      console.error("Repost failed", err);
    }
  }, [rootPost, repostPost]);

  const handlePostBookmark = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!rootPost) return;
    try {
      await bookmarkPost(rootPost.id).unwrap();
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  }, [rootPost, bookmarkPost]);

  const handlePostShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (!rootPost) return;
      const urlToShare = `https://oasis-social.com/post/${rootPost.id}`;
      await Share.share({
        message: `Check out this Oasis discovery by @${rootPost.author?.username || "oasis"}\n${urlToShare}`,
      });
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  }, [rootPost]);

  if (threadLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!rootPost) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-10">
        <View className="w-20 h-20 bg-gray-50 rounded-[40px] items-center justify-center mb-6">
          <Ionicons name="search-outline" size={40} color="#CBD5E1" />
        </View>
        <Text className="text-2xl font-black text-gray-900 tracking-tighter uppercase text-center">
          Missing Thread
        </Text>
        <Text className="text-gray-400 text-center mt-2 font-medium">
          This artifact has vanished into the winds of the oasis.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 px-8 py-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-200"
        >
          <Text className="text-white font-black uppercase tracking-widest text-xs">
            Retrace Steps
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Sticky Header */}
      <BlurView
        intensity={80}
        tint="light"
        className="flex-row items-center px-5 py-4 border-b border-gray-100/50 z-50"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm"
        >
          <Ionicons name="chevron-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <Text className="text-xl font-black ml-4 text-gray-900 tracking-tighter uppercase">
          Artifact
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
              currentUserId={currentUser?.id}
              onReply={handleReplyIntent}
              onOptions={handleOptions}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="p-5 bg-white border-b border-gray-100 rounded-b-[48px] shadow-sm shadow-gray-100">
              {/* Context Link */}
              {rootPost.replyToId && (
                <TouchableOpacity
                  className="mb-4 bg-sky-50 self-start px-3 py-1.5 rounded-xl border border-sky-100/50"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/post/${rootPost.replyToId}`);
                  }}
                >
                  <Text className="text-sky-600 text-[12px] font-black uppercase tracking-wider">
                    Show Ancestor Post
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
                    className="w-14 h-14 rounded-[22px] mr-4 bg-white shadow-md shadow-sky-100"
                    contentFit="cover"
                    transition={300}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-black text-[18px] text-gray-900 tracking-tighter">
                        {rootPost.author?.name || "Member"}
                      </Text>
                      {rootPost.author?.username === "oasis" && (
                        <Ionicons
                          name="checkmark-sharp"
                          size={18}
                          color="#0EA5E9"
                          className="ml-1"
                        />
                      )}
                    </View>
                    <Text className="text-sky-500 font-bold text-[14px]">
                      @{rootPost.author?.username || "oasis"}
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
                        {rootPost.isFollowing ? "Bound" : "Connect"}
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
              <Text className="text-[18px] leading-7 text-gray-900 font-medium mb-5">
                {(() => {
                  if (rootPost.isDeleted)
                    return (
                      <Text className="italic text-gray-400">
                        [Artifact Voluntarily Withdrawn]
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
                      className="w-full h-80 rounded-[40px] mb-6 border border-gray-50 bg-gray-50 shadow-lg shadow-gray-100"
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
                        className="w-72 h-80 rounded-[40px] mr-4 border border-gray-50 bg-gray-50 shadow-md shadow-gray-100"
                        contentFit="cover"
                        transition={400}
                      />
                    ))}
                  </ScrollView>
                );
              })()}

              {/* Precise Timestamp & Metrics */}
              <View className="py-4 border-y border-gray-100/80 mb-4 px-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#94A3B8"
                    />
                    <Text className="text-gray-400 font-bold uppercase text-[11px] ml-2 tracking-widest">
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
                      {rootPost.viewCount ?? rootPost.views ?? 0} Presence
                    </Text>
                  </View>
                </View>
              </View>

              {/* Master Action Bar */}
              <View className="flex-row justify-between items-center px-1">
                <ActionButton
                  icon="chatbubble-outline"
                  count={rootPost._count?.replies}
                  activeColor="#64748B"
                  activeBg="bg-gray-100"
                  onPress={() => inputRef.current?.focus()}
                  size={22}
                />

                <ActionButton
                  icon="repeat"
                  count={rootPost._count?.reposts}
                  active={hasReposted}
                  activeColor="#10B981"
                  activeBg="bg-emerald-50"
                  onPress={handlePostRepost}
                  size={24}
                />

                <ActionButton
                  icon={hasLiked ? "heart" : "heart-outline"}
                  count={rootPost._count?.likes}
                  active={hasLiked}
                  activeColor="#F43F5E"
                  activeBg="bg-rose-50"
                  onPress={handlePostLike}
                  size={24}
                />

                <ActionButton
                  icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                  active={isBookmarked}
                  activeColor="#0EA5E9"
                  activeBg="bg-sky-50"
                  onPress={handlePostBookmark}
                  size={22}
                />

                <TouchableOpacity
                  onPress={handlePostShare}
                  className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50/50"
                >
                  <Ionicons name="share-outline" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="py-20 items-center opacity-40 px-20">
              <View className="w-16 h-16 bg-gray-100 rounded-3xl items-center justify-center mb-4">
                <Ionicons name="sparkles-outline" size={32} color="#94A3B8" />
              </View>
              <Text className="text-gray-900 font-black uppercase text-xs tracking-widest text-center">
                Be the first to respond to this artifact.
              </Text>
            </View>
          }
        />

        {/* Premium Floating Reply Bar */}
        <BlurView
          intensity={95}
          tint="light"
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100/50 px-4 py-4 bg-white/40"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          {replyToId && (
            <View className="flex-row items-center justify-between px-4 py-2 bg-sky-50 rounded-2xl mb-3 border border-sky-100">
              <Text className="text-sky-600 font-bold text-[12px] uppercase tracking-wider">
                Echoing @{replyTargetName}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setReplyToId(null);
                  setReplyTargetName(null);
                }}
                className="w-6 h-6 items-center justify-center rounded-full bg-white shadow-sm"
              >
                <Ionicons name="close" size={14} color="#0EA5E9" />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center">
            <View className="shadow-md shadow-sky-100">
              <Image
                source={{
                  uri:
                    currentUser?.image ||
                    `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser?.id}`,
                }}
                className="w-12 h-12 rounded-[20px] mr-3 bg-white"
                contentFit="cover"
              />
            </View>
            <View className="flex-1 bg-gray-50 rounded-[24px] px-5 py-3 border border-gray-100">
              <TextInput
                ref={inputRef}
                placeholder="Share your resonance..."
                placeholderTextColor="#94A3B8"
                value={replyContent}
                onChangeText={setReplyContent}
                multiline
                className="text-[15px] text-gray-900 font-medium max-h-32"
              />
            </View>
            <TouchableOpacity
              onPress={handleSendReply}
              disabled={!replyContent.trim()}
              className={`ml-3 w-12 h-12 rounded-[20px] items-center justify-center shadow-md ${
                replyContent.trim()
                  ? "bg-sky-500 shadow-sky-200"
                  : "bg-gray-100 shadow-none"
              }`}
            >
              <Ionicons
                name="send"
                size={20}
                color={replyContent.trim() ? "white" : "#CBD5E1"}
                style={{ marginLeft: 3 }}
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </KeyboardAvoidingView>

      <PostOptionsModal
        isVisible={optionsVisible}
        onClose={() => {
          setOptionsVisible(false);
          setSelectedItem(null);
        }}
        isOwner={selectedItem?.author?.id === currentUser?.id}
        onDelete={async () => {
          if (!selectedItem) return;
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deletePost({ id: selectedItem.id }).unwrap();
            if (selectedItem.id === id) {
              router.back();
            } else {
              refetchThread();
            }
          } catch (e) {
            console.error("Delete failed", e);
          }
          setOptionsVisible(false);
          setSelectedItem(null);
        }}
        onReport={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setOptionsVisible(false);
        }}
        onBlock={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
          setOptionsVisible(false);
        }}
      />
    </View>
  );
}
