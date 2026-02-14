import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  useCommentPostMutation,
  useRepostPostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
  useDeleteRepostMutation,
  useBlockPostMutation,
  useBlockUserMutation,
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
  createdAt: string;
  author: User;
  isRepost?: boolean;
  originalPost?: Post;
  likes: Array<{ userId: string }>;
  bookmarks: Array<{ userId: string }>;
  repostedBy: Array<{ userId: string }>;
  _count: {
    comments: number;
    reposts: number;
    likes: number;
    quotes: number;
  };
  views?: number;
  repostedByMe?: boolean;     // ← preferred flag (if backend provides it)
  repostsCount?: number;      // ← optional fallback
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
    const isRepost = !!item.isRepost || !!item.repostedByMe;
    const displayPost = isRepost && item.originalPost ? item.originalPost : item;

    const displayAuthor = displayPost.author;
    const displayId = displayPost.id;

    const hasLiked = useMemo(
      () => displayPost.likes?.some((l) => l.userId === user?.id) ?? false,
      [displayPost.likes, user?.id]
    );

    const isBookmarked = useMemo(
      () => (displayPost.bookmarks?.length ?? 0) > 0,
      [displayPost.bookmarks]
    );

    // Prefer repostedByMe flag if available, otherwise fallback to array check
    const hasReposted = useMemo(
      () =>
        item.repostedByMe ??
        displayPost.repostedBy?.some((r) => r.userId === user?.id) ??
        false,
      [item.repostedByMe, displayPost.repostedBy, user?.id]
    );

    const createdAtFormatted = useMemo(() => {
      if (!displayPost.createdAt) return "";
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(displayPost.createdAt));
    }, [displayPost.createdAt]);

    if (!displayPost) return null;

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
          <TouchableOpacity onPress={() => displayAuthor.id && onPressProfile(displayAuthor.id)}>
            <Image
              source={{ uri: displayAuthor.image || "https://via.placeholder.com/48" }}
              className="w-12 h-12 rounded-full bg-gray-100 mr-3"
            />
          </TouchableOpacity>

          <View className="flex-1">
            {/* Name + username + time + options */}
            <View className="flex-row items-center mb-0.5">
              <Text className="font-bold text-[15px] text-gray-900 flex-shrink" numberOfLines={1}>
                {displayAuthor.name || "User"}
              </Text>
              <Text className="text-gray-500 text-[13.5px] ml-1.5">
                @{displayAuthor.username || "user"} · {createdAtFormatted}
              </Text>
              <TouchableOpacity className="ml-auto p-1.5" onPress={() => onPressOptions(item)}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <Text className="text-[15px] leading-6 text-gray-800 mb-3">
              {displayPost.content}
            </Text>

            {/* Image */}
            {displayPost.image && (
              <Image
                source={{ uri: displayPost.image }}
                className="w-full h-56 rounded-2xl mb-3 border border-gray-100"
                resizeMode="cover"
              />
            )}

            {/* Action row */}
            <View className="flex-row justify-between items-center pr-2 mt-1">
              {/* Comment */}
              <TouchableOpacity className="flex-row items-center" onPress={() => onPressComment(displayId)}>
                <Ionicons name="chatbubble-outline" size={19} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {displayPost._count?.comments ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Repost */}
              <TouchableOpacity className="flex-row items-center" onPress={() => onPressRepost(item)}>
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
              <TouchableOpacity className="flex-row items-center" onPress={() => onLike(displayId)}>
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
                <Ionicons name="stats-chart-outline" size={18} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {displayPost.views ?? 0}
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
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

PostCard.displayName = "PostCard";

// ────────────────────────────────────────────────
// Feed Screen
// ────────────────────────────────────────────────
export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  const [cursor, setCursor] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useGetPostsQuery(
    { type: activeTab, cursor },
    { skip: !user }
  );

  const posts = data?.posts ?? [];
  const nextCursor = data?.nextCursor;

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [commentPost] = useCommentPostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deleteRepost] = useDeleteRepostMutation();
  const [deletePost] = useDeletePostMutation();
  const [blockPost] = useBlockPostMutation();
  const [blockUser] = useBlockUserMutation();

  // ─── Handlers ───────────────────────────────────────

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
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  }, [bookmarkPost]);

  const handleRepostAction = useCallback(
    (post: Post) => {
      const isRepostItem = !!post.isRepost;
      const realPostId = isRepostItem && post.originalPost ? post.originalPost.id : post.id;

      const alreadyReposted = post.repostedByMe ?? post.repostedBy?.some(r => r.userId === user?.id);

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
              router.push({ pathname: "/compose/post", params: { quoteId: realPostId } });
            },
          },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    },
    [user?.id, repostPost, deleteRepost, router]
  );

  const handleCommentSubmit = useCallback(async () => {
    if (!commentContent.trim() || !selectedPostId) return;
    try {
      await commentPost({ postId: selectedPostId, content: commentContent }).unwrap();
      setCommentContent("");
      setIsCommenting(false);
      setSelectedPostId(null);
    } catch (err) {
      console.error("Comment failed", err);
    }
  }, [commentContent, selectedPostId, commentPost]);

  // ─── Render ─────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={{ uri: user?.image || "https://via.placeholder.com/36" }}
            className="w-9 h-9 rounded-full"
          />
        </TouchableOpacity>
        <Text className="text-2xl font-bold tracking-tight">Oasis</Text>
        <Ionicons name="sparkles-outline" size={24} color="#000" />
      </View>

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
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            item={item}
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
          isFetching && cursor ? <ActivityIndicator className="py-6" color="#1d9bf0" /> : null
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
              <Text className="text-[17px] text-gray-700 font-medium">Cancel</Text>
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
        // Add onBlock, onReport, etc. as needed...
      />
    </SafeAreaView>
  );
}


// import React, { useState, useMemo, useCallback, useEffect } from "react";
// import {
//   View,
//   FlatList,
//   ActivityIndicator,
//   Text,
//   TouchableOpacity,
//   Image,
//   RefreshControl,
//   TextInput,
//   ListRenderItem,
//   Alert,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   useGetPostsQuery,
//   useLikePostMutation,
//   useCommentPostMutation,
//   useRepostPostMutation,
//   useBookmarkPostMutation,
//   useDeletePostMutation,
//   useBlockPostMutation,
//   useBlockUserMutation,
//   useDeleteRepostMutation,
// } from "../../store/postApi";
// import { useSelector } from "react-redux";
// import { useRouter } from "expo-router";
// import { SafeAreaView } from "react-native-safe-area-context";
// import PostOptionsModal from "../../components/PostOptionsModal";

// // --- Types ---
// interface User {
//   id: string;
//   name: string;
//   image?: string;
//   username?: string;
// }

// interface Post {
//   id: string;
//   content: string;
//   image?: string;
//   createdAt: string;
//   author: User;
//   isRepost?: boolean;
//   originalPost?: Post;
//   likes: Array<{ userId: string }>;
//   bookmarks: Array<{ userId: string }>;
//   repostedBy: Array<{ userId: string }>; // Updated based on your logs
//   _count: {
//     comments: number;
//     reposts: number;
//     likes: number;
//     quotes: number;
//   };
//   views?: number;
// }

// interface PostCardProps {
//   item: Post;
//   user: User | null;
//   onPressPost: (postId: string) => void;
//   onPressProfile: (authorId: string) => void;
//   onPressOptions: (post: Post) => void;
//   onPressComment: (postId: string) => void;
//   onPressRepost: (post: Post) => void;
//   onLike: (postId: string) => Promise<void>;
//   onBookmark: (postId: string) => Promise<void>;
// }

// // --- Memoized PostCard Component ---
// const PostCard = React.memo(
//   ({
//     item,
//     user,
//     onPressPost,
//     onPressProfile,
//     onPressOptions,
//     onPressComment,
//     onPressRepost,
//     onLike,
//     onBookmark,
//   }: PostCardProps) => {
//     const isRepost = !!item.isRepost;
//     const displayItem = isRepost && item.originalPost ? item.originalPost : item;

//     const displayAuthor = displayItem?.author;
//     const displayId = displayItem?.id;

//     // Logic: Check if current user ID is in the repostedBy array
//     const hasReposted = useMemo(() => {
//       return displayItem?.repostedBy?.some((r) => r.userId === user?.id) || false;
//     }, [displayItem?.repostedBy, user?.id]);

//     const hasLiked = useMemo(
//       () => displayItem?.likes?.some((l) => l.userId === user?.id) || false,
//       [displayItem?.likes, user?.id]
//     );

//     const isBookmarked = useMemo(
//       () => (displayItem?.bookmarks?.length || 0) > 0,
//       [displayItem?.bookmarks]
//     );
//     // console.log("bookmark", );

//     const displayCreatedAt = useMemo(() => {
//       const dateValue = displayItem?.createdAt;
//       if (!dateValue) return "";
//       return new Intl.DateTimeFormat("en-US").format(new Date(dateValue));
//     }, [displayItem?.createdAt]);

//     if (!displayItem) return null;

//     return (
//       <TouchableOpacity
//         onPress={() => displayId && onPressPost(displayId)}
//         activeOpacity={0.9}
//         className="p-4 border-b border-gray-100 bg-white"
//       >
//         {isRepost && (
//           <View className="flex-row items-center mb-2 ml-10">
//             <Ionicons name="repeat" size={16} color="#6B7280" />
//             <Text className="text-gray-500 text-[13px] font-bold ml-2">
//               {item.author?.name} reposted
//             </Text>
//           </View>
//         )}

//         <View className="flex-row">
//           <TouchableOpacity onPress={() => displayAuthor?.id && onPressProfile(displayAuthor.id)}>
//             <Image
//               source={{ uri: displayAuthor?.image || "https://via.placeholder.com/48" }}
//               className="w-12 h-12 rounded-full bg-gray-100 mr-3"
//             />
//           </TouchableOpacity>

//           <View className="flex-1">
//             <View className="flex-row items-center mb-0.5">
//               <Text className="font-bold text-[15px] text-gray-900" numberOfLines={1}>
//                 {displayAuthor?.name || "Anonymous"}
//               </Text>
//               <Text className="text-gray-500 text-[14px] ml-1">
//                 @{displayAuthor?.username || "user"} · {displayCreatedAt}
//               </Text>
//               <TouchableOpacity className="ml-auto p-1" onPress={() => onPressOptions(item)}>
//                 <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
//               </TouchableOpacity>
//             </View>

//             <Text className="text-[15px] leading-[22px] text-gray-800 mb-3">
//               {displayItem.content}
//             </Text>

//             {displayItem.image && (
//               <Image
//                 source={{ uri: displayItem.image }}
//                 className="w-full h-56 rounded-2xl mb-3 border border-gray-100"
//                 resizeMode="cover"
//               />
//             )}

//             {/* Action Bar */}
//             <View className="flex-row justify-between pr-4 mt-1">
//               <TouchableOpacity className="flex-row items-center" onPress={() => displayId && onPressComment(displayId)}>
//                 <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
//                 <Text className="text-gray-500 text-xs ml-1.5">{displayItem._count?.comments || 0}</Text>
//               </TouchableOpacity>

//               <TouchableOpacity className="flex-row items-center" onPress={() => onPressRepost(item)}>
//                 <Ionicons
//                   name="repeat-outline"
//                   size={20}
//                   color={hasReposted ? "#00BA7C" : "#6B7280"}
//                 />
//                 <Text className={`text-xs ml-1.5 ${hasReposted ? "text-[#00BA7C]" : "text-gray-500"}`}>
//                   {displayItem._count?.reposts || 0}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity className="flex-row items-center" onPress={() => displayId && onLike(displayId)}>
//                 <Ionicons
//                   name={hasLiked ? "heart" : "heart-outline"}
//                   size={19}
//                   color={hasLiked ? "#F91880" : "#6B7280"}
//                 />
//                 <Text className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}>
//                   {displayItem._count?.likes || 0}
//                 </Text>
//               </TouchableOpacity>

//               <View className="flex-row items-center">
//                 <Ionicons name="stats-chart-outline" size={17} color="#6B7280" />
//                 <Text className="text-gray-500 text-xs ml-1.5">{displayItem.views || 0}</Text>
//               </View>

//               <TouchableOpacity onPress={() => displayId && onBookmark(displayId)}>
//                 <Ionicons
//                   name={isBookmarked ? "bookmark" : "bookmark-outline"}
//                   size={18}
//                   color={isBookmarked ? "#1d9bf0" : "#6B7280"}
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   }
// );

// // --- Main Feed Screen ---
// export default function FeedScreen() {
//   const [activeTab, setActiveTab] = useState<"public" | "private">("public");
//   const [cursor, setCursor] = useState<string | null>(null);
//   const [commentContent, setCommentContent] = useState("");
//   const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
//   const [isCommenting, setIsCommenting] = useState(false);
//   const [optionsModalVisible, setOptionsModalVisible] = useState(false);
//   const [postForOptions, setPostForOptions] = useState<Post | null>(null);

//   const user = useSelector((state: any) => state.auth.user);
//   const router = useRouter();

//   const { data, isLoading, refetch, isFetching } = useGetPostsQuery({
//     type: activeTab,
//     cursor,
//   });

//   const [likePost] = useLikePostMutation();
//   const [bookmarkPost] = useBookmarkPostMutation();
//   const [commentPost] = useCommentPostMutation();
//   const [repostPost] = useRepostPostMutation();
//   const [deletePost] = useDeletePostMutation();
//   const [deleteRepost] = useDeleteRepostMutation();

//   const posts = data?.posts || [];

//   const handlePressRepost = useCallback(
//     async (post: Post) => {
//       const displayItem = post.isRepost && post.originalPost ? post.originalPost : post;
//       const realPostId = displayItem.id;
      
//       // Corrected logic: Check the array for existing repost
//       const isAlreadyReposted = displayItem.repostedBy?.some((r: any) => r.userId === user?.id);

//       if (isAlreadyReposted) {
//         Alert.alert("Undo Repost", "Remove this from your profile?", [
//           { text: "Cancel", style: "cancel" },
//           {
//             text: "Remove",
//             style: "destructive",
//             onPress: async () => {
//               try {
//                 await deleteRepost(realPostId).unwrap();
//               } catch (e) {
//                 console.error("Undo repost failed:", e);
//               }
//             },
//           },
//         ]);
//       } else {
//         Alert.alert("Repost", "Share this with your followers?", [
//           {
//             text: "Repost",
//             onPress: async () => {
//               try {
//                 await repostPost({ id: realPostId }).unwrap();
//               } catch (e: any) {
//                 if (e.status === 400) {
//                   Alert.alert("Note", "Already reposted");
//                 }
//               }
//             },
//           },
//           {
//             text: "Quote",
//             onPress: () => router.push({ pathname: "/compose/post", params: { quoteId: realPostId } }),
//           },
//           { text: "Cancel", style: "cancel" },
//         ]);
//       }
//     },
//     [repostPost, deleteRepost, user?.id, router]
//   );

//   const handleLike = useCallback(async (postId: string) => {
//     try { await likePost({ postId }).unwrap(); } catch (e) { console.error(e); }
//   }, [likePost]);

//   const handleBookmark = useCallback(async (postId: string) => {
//     try { await bookmarkPost(postId).unwrap(); } catch (e) { console.error(e); }
//   }, [bookmarkPost]);

//   return (
//     <SafeAreaView className="flex-1 bg-white" edges={['top']}>
//       {/* Header */}
//       <View className="px-4 py-2 flex-row items-center justify-between border-b border-gray-50">
//         <TouchableOpacity onPress={() => router.push("/profile")}>
//           <Image
//             source={{ uri: user?.image || "https://via.placeholder.com/32" }}
//             className="w-8 h-8 rounded-full"
//           />
//         </TouchableOpacity>
//         <Text className="text-[22px] font-bold">Oasis</Text>
//         <Ionicons name="sparkles-outline" size={20} color="black" />
//       </View>

//       {/* Tabs */}
//       <View className="flex-row border-b border-gray-100">
//         {["public", "private"].map((tab) => (
//           <TouchableOpacity
//             key={tab}
//             onPress={() => { setCursor(null); setActiveTab(tab as any); }}
//             className="flex-1 items-center py-3"
//           >
//             <Text className={`font-bold ${activeTab === tab ? "text-black" : "text-gray-500"}`}>
//               {tab === "public" ? "For you" : "Following"}
//             </Text>
//             {activeTab === tab && <View className="absolute bottom-0 w-12 h-1 bg-[#1d9bf0] rounded-full" />}
//           </TouchableOpacity>
//         ))}
//       </View>

//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <PostCard
//             item={item}
//             user={user}
//             onPressPost={(id) => router.push(`/post/${id}`)}
//             onPressProfile={(id) => router.push(`/profile/${id}`)}
//             onPressOptions={(p) => { setPostForOptions(p); setOptionsModalVisible(true); }}
//             onPressComment={(id) => { setSelectedPostId(id); setIsCommenting(true); }}
//             onPressRepost={handlePressRepost}
//             onLike={handleLike}
//             onBookmark={handleBookmark}
//           />
//         )}
//         refreshControl={
//           <RefreshControl refreshing={isLoading && !cursor} onRefresh={refetch} tintColor="#1d9bf0" />
//         }
//         onEndReached={() => data?.nextCursor && setCursor(data.nextCursor)}
//         onEndReachedThreshold={0.5}
//         ListFooterComponent={isFetching && cursor ? <ActivityIndicator className="py-4" /> : null}
//       />

//       {/* Floating Action Button */}
//       {!isCommenting && (
//         <TouchableOpacity
//           onPress={() => router.push("/compose/post")}
//           className="absolute bottom-6 right-6 w-14 h-14 bg-[#1d9bf0] rounded-full items-center justify-center shadow-lg"
//         >
//           <Ionicons name="add" size={32} color="white" />
//         </TouchableOpacity>
//       )}

//       {/* Basic Comment Modal (Simplified for full code) */}
//       {isCommenting && (
//         <SafeAreaView className="absolute inset-0 bg-white z-[100] p-4">
//            <View className="flex-row justify-between mb-4">
//               <TouchableOpacity onPress={() => setIsCommenting(false)}><Text className="text-lg">Cancel</Text></TouchableOpacity>
//               <TouchableOpacity className="bg-[#1d9bf0] px-4 py-1 rounded-full"><Text className="text-white font-bold">Reply</Text></TouchableOpacity>
//            </View>
//            <TextInput autoFocus multiline placeholder="Post your reply" className="text-lg" value={commentContent} onChangeText={setCommentContent} />
//         </SafeAreaView>
//       )}

//       <PostOptionsModal
//         isVisible={optionsModalVisible}
//         onClose={() => setOptionsModalVisible(false)}
//         isOwner={postForOptions?.author?.id === user?.id}
//         onDelete={async () => {
//             if(postForOptions) await deletePost({id: postForOptions.id}).unwrap();
//             setOptionsModalVisible(false);
//         }}
//       />
//     </SafeAreaView>
//   );
// }


// // import React, { useState, useMemo, useCallback, useEffect } from "react";
// // import {
// //   View,
// //   FlatList,
// //   ActivityIndicator,
// //   Text,
// //   TouchableOpacity,
// //   Image,
// //   RefreshControl,
// //   TextInput,
// //   ListRenderItem,
// // } from "react-native";
// // import { Ionicons } from "@expo/vector-icons";
// // import {
// //   useGetPostsQuery,
// //   useLikePostMutation,
// //   useCommentPostMutation,
// //   useRepostPostMutation,
// //   useBookmarkPostMutation,
// //   useDeletePostMutation,
// //   useBlockPostMutation,
// //   useBlockUserMutation,
// //   useDeleteRepostMutation,
// // } from "../../store/postApi";
// // import { useSelector } from "react-redux";
// // import { useRouter } from "expo-router";
// // import { SafeAreaView } from "react-native-safe-area-context";
// // import PostOptionsModal from "../../components/PostOptionsModal";
// // // import FollowerSuggestions from "../../components/FollowerSuggestions";

// // // Types
// // interface User {
// //   id: string;
// //   name: string;
// //   image?: string;
// // }

// // interface Comment {
// //   id: string;
// //   content: string;
// //   user: User;
// // }

// // interface Author extends User {
// //   // Extend if needed
// // }

// // interface Post {
// //   id: string;
// //   content: string;
// //   image?: string;
// //   createdAt: string;
// //   author: Author;
// //   isRepost?: boolean;
// //   originalPost?: Post;
// //   likes: Array<{ userId: string }>;
// //   bookmarks: Array<{ userId: string }>;
// //   comments: Comment[];
// //   _count: {
// //     comments: number;
// //     reposts: number;
// //     likes: number;
// //     quotes: number;
// //   };
// //   views?: number;
// //   repostedByMe?: boolean;
// //   repostsCount?: number;
// // }

// // interface PostCardProps {
// //   item: Post;
// //   user: User | null;
// //   onPressPost: (postId: string) => void;
// //   onPressProfile: (authorId: string) => void;
// //   onPressOptions: (post: Post) => void;
// //   onPressComment: (postId: string) => void;
// //   onPressRepost: (post: Post) => void;
// //   onLike: (postId: string) => Promise<void>;
// //   onBookmark: (postId: string) => Promise<void>;
// // }

// // // Memoized PostCard component with improved props
// // const PostCard = React.memo(
// //   ({
// //     item,
// //     user,
// //     onPressPost,
// //     onPressProfile,
// //     onPressOptions,
// //     onPressComment,
// //     onPressRepost,
// //     onLike,
// //     onBookmark,
// //   }: PostCardProps) => {
// //     // const isRepost = item.isRepost;
// //     const isRepost = item.repostedByMe;
// //     const displayItem = isRepost && item.originalPost ? item.originalPost : item;

// //     // Use useMemo for derived values
// //     const displayAuthor = useMemo(() => displayItem?.author, [displayItem]);
// //     const displayContent = useMemo(
// //       () => displayItem?.content || "",
// //       [displayItem],
// //     );
// //     const displayImage = useMemo(() => displayItem?.image, [displayItem]);
// //     const displayId = useMemo(() => displayItem?.id, [displayItem]);
// //     const displayCreatedAt = useMemo(() => {
// //       const dateValue = displayItem?.createdAt;
// //       if (!dateValue) return "";

// //       return new Intl.DateTimeFormat("en-US").format(new Date(dateValue));
// //     }, [displayItem?.createdAt]);

// //     // Memoized handler functions
// //     const handleLike = useCallback(() => {
// //       if (displayId) {
// //         onLike(displayId);
// //       }
// //     }, [displayId, onLike]);

// //     const handleBookmark = useCallback(() => {
// //       if (displayId) {
// //         onBookmark(displayId);
// //       }
// //     }, [displayId, onBookmark]);

// //     const handlePressPost = useCallback(() => {
// //       if (displayId) {
// //         onPressPost(displayId);
// //       }
// //     }, [displayId, onPressPost]);

// //     const handlePressProfile = useCallback(() => {
// //       if (displayAuthor?.id) {
// //         onPressProfile(displayAuthor.id);
// //       }
// //     }, [displayAuthor?.id, onPressProfile]);

// //     const handlePressComment = useCallback(() => {
// //       if (displayId) {
// //         onPressComment(displayId);
// //       }
// //     }, [displayId, onPressComment]);

// //     const handlePressRepost = useCallback(() => {
// //       onPressRepost(item);
// //     }, [item, onPressRepost]);

// //     const handlePressOptions = useCallback(() => {
// //       onPressOptions(item);
// //     }, [item, onPressOptions]);

// //     const hasLiked = useMemo(
// //       () => displayItem?.likes?.some((l) => l.userId === user?.id) || false,
// //       [displayItem?.likes, user?.id],
// //     );

// //     const isBookmarked = useMemo(
// //       () => (displayItem?.bookmarks?.length || 0) > 0,
// //       [displayItem?.bookmarks],
// //     );

// //     if (!displayItem) return null;
// // // console.log(isRepost, item.repostedBy?.id,user?.id, item,'check repost')

// //     return (
// //       <TouchableOpacity
// //         onPress={handlePressPost}
// //         activeOpacity={0.9}
// //         className="p-4 border-b border-gray-100 bg-white"
// //         delayPressIn={50}
// //       >
// //         {isRepost && (
// //           <View className="flex-row items-center mb-2 ml-10">
// //             <Ionicons name="repeat" size={16} color="#6B7280" />
// //             <Text className="text-gray-500 text-[13px] font-bold ml-2">
// //               {item.author?.name} reposted
// //             </Text>
// //           </View>
// //         )}
// //         <View className="flex-row">
// //           <View className="mr-3">
// //             <TouchableOpacity
// //               onPress={handlePressProfile}
// //               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //             >
// //               <Image
// //                 source={{
// //                   uri: displayAuthor?.image || "https://via.placeholder.com/48",
// //                 }}
// //                 className="w-12 h-12 rounded-full bg-gray-100"
// //                 defaultSource={{ uri: "https://via.placeholder.com/48" }}
// //               />
// //             </TouchableOpacity>
// //           </View>

// //           <View className="flex-1">
// //             <View className="flex-row items-center mb-0.5">
// //               <Text
// //                 className="font-bold text-[15px] text-gray-900"
// //                 numberOfLines={1}
// //               >
// //                 {displayAuthor?.name || "Anonymous"}
// //               </Text>
// //               <Text className="text-gray-500 text-[14px] ml-1">
// //                 @{displayAuthor?.name?.toLowerCase().replace(/\s/g, "")} ·{" "}
// //                 {displayCreatedAt}
// //               </Text>
// //               <TouchableOpacity
// //                 className="ml-auto p-1"
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //                 onPress={handlePressOptions}
// //               >
// //                 <Ionicons
// //                   name="ellipsis-horizontal"
// //                   size={16}
// //                   color="#6B7280"
// //                 />
// //               </TouchableOpacity>
// //             </View>

// //             <Text className="text-[15px] leading-[22px] text-gray-800 mb-3">
// //               {displayContent}
// //             </Text>

// //             {displayImage && (
// //               <Image
// //                 source={{ uri: displayImage }}
// //                 className="w-full h-56 rounded-2xl mb-3 border border-gray-100"
// //                 resizeMode="cover"
// //                 progressiveRenderingEnabled
// //               />
// //             )}

// //             <View className="flex-row justify-between pr-4 mt-1">
// //               <TouchableOpacity
// //                 className="flex-row items-center"
// //                 onPress={handlePressComment}
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //               >
// //                 <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
// //                 <Text className="text-gray-500 text-xs ml-1.5">
// //                   {displayItem._count?.comments || 0}
// //                 </Text>
// //               </TouchableOpacity>

// //               <TouchableOpacity
// //                 className="flex-row items-center"
// //                 disabled={displayItem.repostedByMe}
// //                 onPress={handlePressRepost}
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //               >
// //                 <Ionicons
// //                   name="repeat-outline"
// //                   size={20}
// //                   color={displayItem.repostedByMe ? "#00BA7C" : "rgba(255, 0, 149, 1)"}
// //                 />
// //                 <Text
// //                   className={`text-xs ml-1.5 ${displayItem.repostedByMe ? "text-[#00BA7C]" : "text-gray-500"}`}
// //                 >
// //                   {displayItem.repostsCount || displayItem._count?.reposts || 0}
// //                 </Text>
// //               </TouchableOpacity>

       
// // {/* 
// //               <TouchableOpacity
// //                 className="flex-row items-center"
// //                 disabled={displayItem.repostedByMe}
// //                 onPress={handlePressRepost}
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //               >
// //                 <Ionicons
// //                   name="repeat-outline"
// //                   size={20}
// //                   color={displayItem.repostedByMe ? "#00BA7C" : "rgba(255, 0, 149, 1)"}
// //                 />
// //                 <Text
// //                   className={`text-xs ml-1.5 ${displayItem.repostedByMe ? "text-[#00BA7C]" : "text-gray-500"}`}
// //                 >
// //                   {displayItem.repostsCount || displayItem._count?.reposts || 0}
// //                 </Text>
// //               </TouchableOpacity>

// //                   <TouchableOpacity
// //                 className="flex-row items-center"
// //                 disabled={displayItem.isRepost}
// //                 onPress={handlePressRepost}
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //               >
// //                 <Ionicons
// //                   name="repeat-outline"
// //                   size={20}
// //                   color={displayItem.isRepost ? "#00BA7C" : "rgba(38, 0, 255, 1)"}
// //                 />
// //                 <Text
// //                   className={`text-xs ml-1.5 ${displayItem.isRepost ? "text-[#00BA7C]" : "text-gray-500"}`}
// //                 >
// //                   {displayItem.repostsCount || displayItem._count?.reposts || 0}
// //                 </Text>
// //               </TouchableOpacity> */}


// //               <TouchableOpacity
// //                 className="flex-row items-center"
// //                 onPress={handleLike}
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //               >
// //                 <Ionicons
// //                   name={hasLiked ? "heart" : "heart-outline"}
// //                   size={19}
// //                   color={hasLiked ? "#F91880" : "#6B7280"}
// //                 />
// //                 <Text
// //                   className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
// //                 >
// //                   {displayItem._count?.likes || 0}
// //                 </Text>
// //               </TouchableOpacity>

// //               <View className="flex-row items-center">
// //                 <Ionicons
// //                   name="stats-chart-outline"
// //                   size={17}
// //                   color="#6B7280"
// //                 />
// //                 <Text className="text-sky-500 text-xs ml-1.5">
// //                   {displayItem.views || 0}
// //                 </Text>
// //               </View>

// //               <TouchableOpacity
// //                 className="flex-row items-center"
// //                 onPress={handleBookmark}
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //               >
// //                 <Ionicons
// //                   name={isBookmarked ? "bookmark" : "bookmark-outline"}
// //                   size={18}
// //                   color={isBookmarked ? "#1d9bf0" : "#6B7280"}
// //                 />
// //               </TouchableOpacity>

// //               <TouchableOpacity
// //                 className="p-1"
// //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //               >
// //                 <Ionicons name="share-outline" size={18} color="#6B7280" />
// //               </TouchableOpacity>
// //             </View>

// //             {/* {displayItem.comments?.length > 0 && (
// //               <View className="mt-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
// //                 {displayItem.comments.slice(0, 2).map((comment: Comment) => (
// //                   <View key={comment.id} className="flex-row mb-1.5 last:mb-0">
// //                     <Text
// //                       className="font-bold text-[13px] text-gray-900 mr-1"
// //                       numberOfLines={1}
// //                     >
// //                       {comment.user?.name}:
// //                     </Text>
// //                     <Text className="text-[13px] text-gray-600 flex-1 leading-4">
// //                       {comment.content}
// //                     </Text>
// //                   </View>
// //                 ))}
// //               </View>
// //             )} */}
// //           </View>
// //         </View>
// //       </TouchableOpacity>
// //     );
// //   },
// // );

// // PostCard.displayName = "PostCard";

// // export default function FeedScreen() {
// //   const [activeTab, setActiveTab] = useState<"public" | "private">("public");
// //   const [cursor, setCursor] = useState<string | null>(null);
// //   const [commentContent, setCommentContent] = useState("");
// //   const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
// //   const [isCommenting, setIsCommenting] = useState(false);
// //   const [optionsModalVisible, setOptionsModalVisible] = useState(false);
// //   const [postForOptions, setPostForOptions] = useState<Post | null>(null);

// //   const user = useSelector((state: any) => state.auth.user);
// //   const router = useRouter();

// //   // Reset cursor when tab changes
// //   useEffect(() => {
// //     setCursor(null);
// //   }, [activeTab]);

// //   const { data, isLoading, refetch, isFetching } = useGetPostsQuery({
// //     type: activeTab,
// //     cursor,
// //   });

// //   const posts: Post[] = data?.posts || [];
// //   const nextCursor = data?.nextCursor;

// //   const [likePost] = useLikePostMutation();
// //   const [bookmarkPost] = useBookmarkPostMutation();
// //   const [commentPost] = useCommentPostMutation();
// //   const [repostPost] = useRepostPostMutation();
// //   const [deletePost] = useDeletePostMutation();
// //   const [deleteRepost] = useDeleteRepostMutation();
// //   const [blockPost] = useBlockPostMutation();
// //   const [blockUser] = useBlockUserMutation();

// //   const handleComment = useCallback(async () => {
// //     if (!commentContent.trim() || !selectedPostId) return;
// //     try {
// //       // Check your API for the correct parameter name
// //       await commentPost({
// //         postId: selectedPostId,
// //         content: commentContent,
// //       }).unwrap();
// //       setCommentContent("");
// //       setIsCommenting(false);
// //       setSelectedPostId(null);
// //     } catch (e) {
// //       console.error("Failed to comment:", e);
// //     }
// //   }, [commentContent, selectedPostId, commentPost]);

// //   const handleLike = useCallback(
// //     async (postId: string) => {
// //       try {
// //         await likePost({ postId }).unwrap();
// //       } catch (error) {
// //         console.error("Like failed:", error);
// //       }
// //     },
// //     [likePost],
// //   );

// //   const handleBookmark = useCallback(
// //     async (postId: string) => {
// //       try {
// //         await bookmarkPost(postId);
// //       } catch (error) {
// //         console.error("Bookmark failed:", error);
// //       }
// //     },
// //     [bookmarkPost],
// //   );

// //   const openOptions = useCallback((post: Post) => {
// //     setPostForOptions(post);
// //     setOptionsModalVisible(true);
// //   }, []);

// //   const closeOptions = useCallback(() => {
// //     setOptionsModalVisible(false);
// //     setPostForOptions(null);
// //   }, []);

// //   const loadMore = useCallback(() => {
// //     if (nextCursor && !isFetching) {
// //       setCursor(nextCursor);
// //     }
// //   }, [nextCursor, isFetching]);

// //   const onRefresh = useCallback(() => {
// //     setCursor(null);
// //     refetch();
// //   }, [refetch]);

// //   // Memoized callbacks for PostCard
// //   const handlePressPost = useCallback(
// //     (postId: string) => {
// //       router.push(`/post/${postId}`);
// //     },
// //     [router],
// //   );

// //   const handlePressProfile = useCallback(
// //     (authorId: string) => {
// //       router.push(`/profile/${authorId}`);
// //     },
// //     [router],
// //   );

// //   const handlePressComment = useCallback((postId: string) => {
// //     setSelectedPostId(postId);
// //     setIsCommenting(true);
// //   }, []);

// //   const handlePressRepost = useCallback(
// //     async (post: Post) => {
// //       const isRepostedByMe = post.repostedByMe;
// //       const targetId = post.id; // Use raw ID (if virtual, logic in backend should handle? NO, frontend must handle)
// //       // Virtual ID "repost_ID". We need REAL ID of the post to repost.
// //       // If it's a repost, we want to repost the ORIGINAL post?
// //       // Or if I delete repost, I delete the virtual item?
// //       // User: "Undo Repost".
// //       // If I confirm Undo, I call deleteRepost(targetId).
// //       // Wait, if ID is "repost_xyz", backend deleteRepost needs real ID?
// //       // Backend delete /:id/repost expects POST ID.
// //       // If I pass "repost_xyz", logic fails.
// //       // But my feed logic returns `originalPost`.
// //       // The `post` object passed here is the `item`.
// //       // If it's a repost (virtual), `item.id` is `repost_...`.
// //       // `item.originalPost.id` is the real post ID.
// //       // If I undo, I undo MY repost of `item.originalPost.id`.
// //       // So I should use `post.originalPost?.id || post.id`?
// //       // Wait, `repostedByMe` is on `displayItem` (which is `originalPost` for reposts).
// //       // So `post` passed to this function is `item` (the wrapper).
// //       // `displayItem` inside PostCard is what has `repostedByMe`.
// //       // BUT `item` passed here is the wrapper. The wrapper has `repostedByMe`?
// //       // In `get /feed`, I set `repostedByMe` on the *original post* object I return inside the wrapper?
// //       // "return { ...item.post, ..., repostedByMe: ... }".
// //       // So the wrapper (which IS the post object with extra props) has it.
// //       // Yes.
// //       // But if `isRepost` is true, the ID is `repost_...`.
// //       // The `originalPost` field contains the original post object.
// //       // If I want to repost the ORIGINAL content, I should use `originalPost.id`?
// //       // If I want to "Undo Repost", I should delete the repost record.
// //       // `deleteRepost` takes `id` (Post ID).
// //       // So I need the Post ID.
// //       // If `post.isRepost` is true, the actual post I am interacting with is `post.originalPost`?
// //       // OR, does `post` (the wrapper) contain the ID of the original post in some other field?
// //       // `item.post` in backend became `...item.post`. So `id` is overridden by `repost_...`.
// //       // But `originalPost` is preserving `item.post`.
// //       // So: const realPostId = post.isRepost && post.originalPost ? post.originalPost.id : post.id;
      
// //       const realPostId = post.isRepost && post.originalPost ? post.originalPost.id : post.id;
// //       // Also need to check `post.repostedByMe` or `displayItem.repostedByMe`.
// //       // Since `post` here is `item`, and `item` is the wrapper.
// //       // Wrapper has `repostedByMe` set?
// //       // Backend: `results` map -> `repostedByMe: item.post.repostedBy.length > 0`.
// //       // So YES, wrapper has `repostedByMe`.
      
// //       if (post.repostedByMe) {
// //           // Undo Repost
// //           try {
// //              await deleteRepost(realPostId).unwrap();
// //           } catch(e) {
// //              console.error("Undo repost failed:", e);
// //           }
// //       } else {
// //         // Show ActionSheet
// //         // For now using Alert
// //         const { Alert } = require("react-native"); // Import inline to avoid top-level issues if any
// //         Alert.alert("Repost", "", [
// //           {
// //             text: "Repost",
// //             onPress: async () => {
// //               try {
// //                 await repostPost({ id: realPostId }).unwrap();
// //               } catch (e) { console.error(e); }
// //             }
// //           },
// //           {
// //             text: "Quote",
// //             onPress: () => {
// //               router.push({ pathname: "/compose/post", params: { quoteId: realPostId } });
// //             }
// //           },
// //           { text: "Cancel", style: "cancel" }
// //         ]);
// //       }
// //     },
// //     [repostPost, deleteRepost, router],
// //   );

// //   // Memoized renderItem
// //   const renderItem: ListRenderItem<Post> = useCallback(
// //     ({ item }) => (
// //       <PostCard
// //         item={item}
// //         user={user}
// //         onPressPost={handlePressPost}
// //         onPressProfile={handlePressProfile}
// //         onPressOptions={openOptions}
// //         onPressComment={handlePressComment}
// //         onPressRepost={handlePressRepost}
// //         onLike={handleLike}
// //         onBookmark={handleBookmark}
// //       />
// //     ),
// //     [
// //       user,
// //       handlePressPost,
// //       handlePressProfile,
// //       openOptions,
// //       handlePressComment,
// //       handlePressRepost,
// //       handleLike,
// //       handleBookmark,
// //     ],
// //   );

// //   // Memoized keyExtractor
// //   const keyExtractor = useCallback((item: Post) => item.id, []);

// //   // // Improved getItemLayout
// //   // const getItemLayout = useCallback(
// //   //   (data: Post[] | null | undefined, index: number) => ({
// //   //     length: 200,
// //   //     offset: 200 * index,
// //   //     index,
// //   //   }),
// //   //   [],
// //   // );

// //   // Memoized list footer
// //   const ListFooterComponent = useMemo(() => {
// //     if (isFetching && cursor) {
// //       return (
// //         <View className="py-4">
// //           <ActivityIndicator color="#1d9bf0" />
// //         </View>
// //       );
// //     }
// //     return null;
// //   }, [isFetching, cursor]);

// //   // Memoized list empty component
// //   const ListEmptyComponent = useMemo(() => {
// //     if (!isLoading) {
// //       return (
// //         <View className="items-center justify-center p-10 mt-10">
// //           <Text className="text-gray-400 text-center text-lg font-medium">
// //             No posts to show right now.
// //           </Text>
// //         </View>
// //       );
// //     }
// //     return null;
// //   }, [isLoading]);

// //   // Handle comment modal dismissal
// //   useEffect(() => {
// //     if (!isCommenting) {
// //       setSelectedPostId(null);
// //       setCommentContent("");
// //     }
// //   }, [isCommenting]);

// //   return (
// //     <SafeAreaView className="flex-1 bg-white">
// //       {/* Premium Header */}
// //       <View className="px-4 py-2 flex-row items-center justify-between border-b border-gray-50">
// //         <TouchableOpacity
// //           onPress={() => router.push("/(tabs)/profile")}
// //           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //         >
// //           <Image
// //             source={{ uri: user?.image || "https://via.placeholder.com/32" }}
// //             className="w-8 h-8 rounded-full"
// //             defaultSource={{ uri: "https://via.placeholder.com/32" }}
// //           />
// //         </TouchableOpacity>
// //         <Text className="text-[24px] font-bold">Oasis</Text>
// //         <TouchableOpacity
// //           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //         >
// //           <Ionicons name="sparkles-outline" size={20} color="black" />
// //         </TouchableOpacity>
// //       </View>

// //       {/* Tabs */}
// //       <View className="flex-row border-b border-gray-100">
// //         {(["public", "private"] as const).map((tab) => (
// //           <TouchableOpacity
// //             key={tab}
// //             onPress={() => setActiveTab(tab)}
// //             className="flex-1 items-center pt-3 pb-3"
// //             activeOpacity={0.7}
// //           >
// //             <Text
// //               className={`text-[15px] font-bold ${activeTab === tab ? "text-gray-900" : "text-gray-500"}`}
// //             >
// //               {tab === "public" ? "For you" : "Following"}
// //             </Text>
// //             {activeTab === tab && (
// //               <View className="absolute bottom-0 w-14 h-1 bg-[#1d9bf0] rounded-full" />
// //             )}
// //           </TouchableOpacity>
// //         ))}
// //       </View>

// //       {/* Posts List */}
// //       <FlatList
// //         data={posts}
// //         renderItem={renderItem}
// //         keyExtractor={keyExtractor}
// //         // getItemLayout={getItemLayout}
// //         removeClippedSubviews={true}
// //         maxToRenderPerBatch={8}
// //         windowSize={7}
// //         initialNumToRender={6}
// //         updateCellsBatchingPeriod={30}
// //         refreshControl={
// //           <RefreshControl
// //             refreshing={isLoading && !cursor}
// //             onRefresh={onRefresh}
// //             tintColor="#1d9bf0"
// //             colors={["#1d9bf0"]}
// //           />
// //         }
// //         onEndReached={loadMore}
// //         onEndReachedThreshold={0.3}
// //         ListFooterComponent={ListFooterComponent}
// //         contentContainerStyle={{ paddingBottom: 100 }}
// //         ListEmptyComponent={ListEmptyComponent}
// //         showsVerticalScrollIndicator={false}
// //         // ListHeaderComponent={
// //         //   activeTab === "public" ? <FollowerSuggestions /> : null
// //         // }
// //       />

// //       {/* Floating Action Button */}
// //       {!isCommenting && (
// //         <TouchableOpacity
// //           onPress={() => router.push("/compose/post")}
// //           className="absolute bottom-6 right-6 w-14 h-14 bg-[#1d9bf0] rounded-full items-center justify-center shadow-xl shadow-sky-500/40 active:opacity-90"
// //           style={{ elevation: 8 }}
// //           activeOpacity={0.8}
// //         >
// //           <Ionicons name="add" size={32} color="white" />
// //         </TouchableOpacity>
// //       )}

// //       {/* Compose Reply Modal */}
// //       {isCommenting && (
// //         <View className="absolute inset-0 bg-white z-[100]">
// //           <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-50">
// //             <TouchableOpacity
// //               onPress={() => setIsCommenting(false)}
// //               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
// //             >
// //               <Text className="text-[17px] text-gray-800">Cancel</Text>
// //             </TouchableOpacity>
// //             <TouchableOpacity
// //               onPress={handleComment}
// //               disabled={!commentContent.trim()}
// //               className={`px-6 py-2 rounded-full ${commentContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"}`}
// //               activeOpacity={0.8}
// //             >
// //               <Text className="text-white font-bold text-[15px]">Reply</Text>
// //             </TouchableOpacity>
// //           </View>
// //           <View className="flex-row p-4">
// //             <Image
// //               source={{ uri: user?.image || "https://via.placeholder.com/40" }}
// //               className="w-11 h-11 rounded-full mr-3"
// //               defaultSource={{ uri: "https://via.placeholder.com/40" }}
// //             />
// //             <TextInput
// //               autoFocus
// //               multiline
// //               placeholder="Post your reply"
// //               placeholderTextColor="#9CA3AF"
// //               className="flex-1 text-[19px] leading-6 pt-1 text-gray-900"
// //               value={commentContent}
// //               onChangeText={setCommentContent}
// //               textAlignVertical="top"
// //               maxLength={280}
// //               returnKeyType="done"
// //               blurOnSubmit={true}
// //             />
// //           </View>
// //         </View>
// //       )}
// //       <PostOptionsModal
// //         isVisible={optionsModalVisible}
// //         onClose={closeOptions}
// //         isOwner={postForOptions?.author?.id === user?.id}
// //         onDelete={async () => {
// //           if (!postForOptions?.id) return;

// //           try {
// //             await deletePost({
// //               id: postForOptions.id, // Changed from postId to id
// //             }).unwrap();

// //             alert("Post deleted successfully");
// //             closeOptions();
// //           } catch (error: any) {
// //             console.error("Error deleting post:", error);
// //             const errorMessage = error?.data?.message || "Something went wrong";
// //             alert(`Failed to delete: ${errorMessage}`);
// //           }
// //         }}
// //         onReport={async () => {
// //           if (!postForOptions?.id) return;
// //           // alert("Thank you for reporting this post.");
// //           try {
// //             await blockPost({
// //               id: postForOptions.id, // Changed from postId to id
// //               reason: "SPAM",
// //             }).unwrap();

// //             alert("Post blocked successfully");
// //             closeOptions();
// //           } catch (error: any) {
// //             console.error("Error blocking post:", error);
// //             const errorMessage = error?.data?.message || "Something went wrong";
// //             alert(`Failed to block: ${errorMessage}`);
// //           }
// //           closeOptions();
// //         }}
// //         onBlock={async () => {
// //           if (!postForOptions?.id) return;
// //           try {
// //             await blockUser({
// //               id: postForOptions.id, // Changed from postId to id
// //             }).unwrap();

// //             alert("User blocked successfully");
// //             closeOptions();
// //           } catch (error: any) {
// //             console.error("Error blocking user:", error);
// //             const errorMessage = error?.data?.message || "Something went wrong";
// //             alert(`Failed to block: ${errorMessage}`);
// //           }
// //           alert(`Blocked @${postForOptions?.author?.name}`);
// //           closeOptions();
// //           refetch();
// //         }}
// //       />
// //     </SafeAreaView>
// //   );
// // }
