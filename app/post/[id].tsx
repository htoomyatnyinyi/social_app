import React, { useState, useCallback, useRef, memo } from "react";
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
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetPostQuery,
  useGetCommentsQuery,
  useCommentPostMutation,
  useLikePostMutation,
  useRepostPostMutation,
  useIncrementViewCountMutation,
  useBookmarkPostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";
import { useFollowUserMutation } from "@/store/profileApi";
import { SafeAreaView } from "react-native-safe-area-context";
import PostOptionsModal from "../../components/PostOptionsModal";

// ────────────────────────────────────────────────
// Types (minimal)
// ────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  username?: string;
  image?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  parentId?: string;
  parent?: Comment;
  replies?: Comment[];
  _count?: { replies: number };
}

interface Post {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  author: User;
  likes: Array<{ userId: string }>;
  bookmarks: Array<{ userId: string }>;
  _count: {
    comments: number;
    reposts: number;
    likes: number;
    shares?: number;
  };
  views?: number;
}

// ────────────────────────────────────────────────
// Memoized Comment Item
// ────────────────────────────────────────────────
const CommentItem = memo(
  ({
    item,
    currentUserId,
    onReply,
    onOptions,
  }: {
    item: Comment;
    currentUserId?: string;
    onReply: (commentId: string, username: string) => void;
    onOptions: (item: Comment) => void;
  }) => {
    const isReply = !!item.parentId;

    return (
      <View
        className={`${isReply ? "ml-12 border-l-2 border-gray-200 pl-4" : "border-b border-gray-100"} bg-white`}
      >
        <View className="flex-row p-4">
          <Image
            source={{
              uri: item.user?.image || "https://via.placeholder.com/40",
            }}
            className="w-10 h-10 rounded-full mr-3 bg-gray-100"
          />
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-0.5">
              <View className="flex-row items-baseline gap-1.5">
                <Text className="font-bold text-[15px] text-gray-900">
                  {item.user?.name || "User"}
                </Text>
                <Text className="text-gray-500 text-[13.5px]">
                  @
                  {item.user?.username ||
                    item.user?.name?.toLowerCase().replace(/\s+/g, "")}
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

            {item.parentId && item.parent?.user && (
              <Text className="text-[#1d9bf0] text-[13.5px] mb-1">
                Replying to @{item.parent.user.name}
              </Text>
            )}

            <Text className="text-[15px] leading-6 text-gray-800">
              {item.content}
            </Text>

            <View className="flex-row mt-3 items-center justify-between pr-8">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onReply(item.id, item.user?.name)}
              >
                <Ionicons name="chatbubble-outline" size={17} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {item._count?.replies ?? item.replies?.length ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center">
                <Ionicons name="repeat-outline" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center">
                <Ionicons name="heart-outline" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity>
                <Ionicons name="share-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nested replies */}
        {item.replies?.map((reply) => (
          <CommentItem
            key={reply.id}
            item={reply}
            currentUserId={currentUserId}
            onReply={onReply}
            onOptions={onOptions}
          />
        ))}
      </View>
    );
  },
);

CommentItem.displayName = "CommentItem";

// ────────────────────────────────────────────────
// Main Post Detail Screen
// ────────────────────────────────────────────────
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: any) => state.auth.user);

  const [commentContent, setCommentContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null); // Post | Comment

  const inputRef = useRef<TextInput>(null);

  const { data: post, isLoading: postLoading } = useGetPostQuery(id!, {
    skip: !id,
  });
  const {
    data: commentsData,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useGetCommentsQuery(id!, { skip: !id });

  const [commentPost] = useCommentPostMutation();
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [incrementView] = useIncrementViewCountMutation();
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();

  const comments = commentsData ?? [];

  // Auto-increment view count once
  React.useEffect(() => {
    if (id) {
      incrementView({ postId: id }).catch(() => {});
    }
  }, [id]);

  const handleSendComment = useCallback(async () => {
    if (!commentContent.trim() || !id) return;

    const content = commentContent.trim();
    const parentId = replyToId;

    setCommentContent("");
    setReplyToId(null);
    setReplyTargetName(null);

    try {
      await commentPost({
        postId: id,
        content,
        // parentId: parentId,

        ...(parentId ? { parentId } : {}),
      }).unwrap();
      refetchComments();
    } catch (err) {
      console.error("Comment failed", err);
      // Optionally show toast / alert
    }
  }, [commentContent, id, replyToId, commentPost, refetchComments]);

  const handleReply = useCallback((commentId: string, username: string) => {
    console.log(
      "commentId",
      commentId,
      "username",
      username,
      "at handle reply comment callback",
    );

    setReplyToId(commentId);
    setReplyTargetName(username);
    setCommentContent("");
    inputRef.current?.focus();
  }, []);

  const handleOptions = useCallback((item: any) => {
    setSelectedItem(item);
    setOptionsVisible(true);
  }, []);

  const handleFollow = useCallback(async () => {
    if (!post?.author?.id) return;
    try {
      await followUser(post.author.id).unwrap();
    } catch (err) {
      console.error("Follow failed", err);
    }
  }, [post?.author?.id, followUser]);

  const hasLiked =
    post?.likes?.some((l: any) => l.userId === currentUser?.id) ?? false;
  const isBookmarked =
    post?.bookmarks?.some((b: any) => b.userId === currentUser?.id) ?? false;

  if (postLoading || commentsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  if (!post) {
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem
              item={item}
              currentUserId={currentUser?.id}
              onReply={(commentId, username) => {
                handleReply(commentId, username);
              }}
              onOptions={handleOptions}
            />
          )}
          ListHeaderComponent={
            <View className="p-4 bg-white border-b border-gray-100">
              {/* Author row */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center">
                  <Image
                    source={{
                      uri:
                        post.author?.image || "https://via.placeholder.com/48",
                    }}
                    className="w-12 h-12 rounded-full mr-3 bg-gray-100"
                  />
                  <View>
                    <Text className="font-bold text-[16px] text-gray-900">
                      {post.author?.name || "User"}
                    </Text>
                    <Text className="text-gray-500 text-[14.5px]">
                      @
                      {post.author?.username ||
                        post.author?.name?.toLowerCase().replace(/\s+/g, "")}
                    </Text>
                  </View>
                </View>

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
              </View>

              {/* Content */}
              <Text className="text-[17px] leading-6 text-gray-900 mb-4">
                {post.content}
              </Text>

              {post.image && (
                <Image
                  source={{ uri: post.image }}
                  className="w-full h-64 rounded-2xl mb-5 border border-gray-100"
                  resizeMode="cover"
                />
              )}

              {/* Timestamp + views */}
              <View className="flex-row items-center py-2.5 border-y border-gray-100 mb-2">
                <Text className="text-gray-600 text-[15px]">
                  {new Date(post.createdAt).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  ·{" "}
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {post.views ?? 0} Views
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
                    {post._count?.comments ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => repostPost({ id: post.id })}
                >
                  <Ionicons name="repeat-outline" size={24} color="#6B7280" />
                  <Text className="text-gray-600 text-[15px] ml-2">
                    {post._count?.reposts ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => likePost({ postId: post.id })}
                >
                  <Ionicons
                    name={hasLiked ? "heart" : "heart-outline"}
                    size={23}
                    color={hasLiked ? "#F91880" : "#6B7280"}
                  />
                  <Text
                    className={`text-[15px] ml-2 ${hasLiked ? "text-[#F91880] font-medium" : "text-gray-600"}`}
                  >
                    {post._count?.likes ?? 0}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row items-center">
                  <Ionicons
                    name="stats-chart-outline"
                    size={22}
                    color="#6B7280"
                  />
                  <Text className="text-gray-600 text-[15px] ml-2">
                    {post.views ?? 0}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => bookmarkPost(post.id)}>
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={23}
                    color={isBookmarked ? "#1d9bf0" : "#6B7280"}
                  />
                </TouchableOpacity>

                <TouchableOpacity>
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
                value={commentContent}
                onChangeText={setCommentContent}
                multiline
                className="text-[16px] text-gray-900 max-h-24"
              />
            </View>
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={!commentContent.trim()}
              className={`ml-3 px-5 py-2.5 rounded-full ${
                commentContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"
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
          selectedItem?.user?.id === currentUser?.id ||
          selectedItem?.author?.id === currentUser?.id
        }
        onDelete={() => {
          alert("Delete coming soon");
          setOptionsVisible(false);
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

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   useGetPostQuery,
//   useGetCommentsQuery,
//   useCommentPostMutation,
//   useLikePostMutation,
//   useRepostPostMutation,
//   useIncrementViewCountMutation,
//   useBookmarkPostMutation,
// } from "../../store/postApi";
// import { useSelector } from "react-redux";
// import { useFollowUserMutation } from "@/store/profileApi";
// import { SafeAreaView } from "react-native-safe-area-context";
// import PostOptionsModal from "../../components/PostOptionsModal";

// export default function PostDetailScreen() {
//   const { id } = useLocalSearchParams();
//   const router = useRouter();
//   const user = useSelector((state: any) => state.auth.user);

//   const [commentContent, setCommentContent] = useState("");
//   const [replyToId, setReplyToId] = useState<string | null>(null);

//   const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
//   const [optionsModalVisible, setOptionsModalVisible] = useState(false);
//   const [itemForOptions, setItemForOptions] = useState<any>(null); // Post or Comment

//   // 1. Call hook at TOP LEVEL of the component
//   const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();

//   const { data: post, isLoading: isPostLoading } = useGetPostQuery(id);
//   const {
//     data: comments,
//     isLoading: isCommentsLoading,
//     refetch: refetchComments,
//   } = useGetCommentsQuery(id);

//   const [commentPost] = useCommentPostMutation();
//   const [likePost] = useLikePostMutation();
//   const [repostPost] = useRepostPostMutation();
//   const [bookmarkPost] = useBookmarkPostMutation();
//   const [incrementViewCount] = useIncrementViewCountMutation();

//   React.useEffect(() => {
//     if (id) {
//       incrementViewCount({ postId: id as string });
//     }
//   }, [id, incrementViewCount]);

//   const handleSendComment = async () => {
//     if (!commentContent.trim()) return;
//     const content = commentContent;
//     const pId = replyToId;

//     // Clear input immediately for better UX
//     setCommentContent("");
//     setReplyToId(null);
//     setReplyTargetName(null);

//     try {
//       await commentPost({
//         id: id as string,
//         content: content,
//         parentId: pId || undefined,
//       }).unwrap();
//     } catch (e) {
//       console.error(e);
//       // Optional: restore content if it failed?
//       // But optimistic update will undo itself, so maybe user knows it failed.
//       // For now, let's keep it simple.
//     }
//   };

//   const handleFollowUser = async (userId: string) => {
//     if (!userId) return;

//     try {
//       // 2. Call the trigger function here (not the hook!)
//       await followUser(userId); // Use the trigger function with ID string
//       console.log("Follow successful");
//       // toast.success("Followed!") or whatever
//     } catch (err) {
//       console.error("Follow failed", err);
//       // toast.error(...)
//     }
//   };

//   if (isPostLoading || isCommentsLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <ActivityIndicator size="large" color="#1d9bf0" />
//       </View>
//     );
//   }

//   const CommentItem = ({
//     item,
//     isReply = false,
//   }: {
//     item: any;
//     isReply?: boolean;
//   }) => (
//     <SafeAreaView
//       className={`bg-white ${isReply ? "ml-12" : "border-b border-gray-50"}`}
//     >
//       <View className="flex-row p-4">
//         <Image
//           source={{ uri: item.user?.image || "https://via.placeholder.com/40" }}
//           className="w-10 h-10 rounded-full mr-3 bg-gray-100"
//         />
//         <View className="flex-1">
//           <View className="flex-row items-center justify-between">
//             <View className="flex-row items-center">
//               <Text className="font-bold text-[15px] text-gray-900">
//                 {item.user?.name}
//               </Text>
//               <Text className="text-gray-500 text-[14px] ml-1">
//                 · {new Date(item.createdAt).toLocaleDateString()}
//               </Text>
//             </View>
//             <TouchableOpacity
//               className="p-1"
//               onPress={() => {
//                 setItemForOptions(item);
//                 setOptionsModalVisible(true);
//               }}
//             >
//               <Ionicons name="ellipsis-horizontal" size={14} color="#6B7280" />
//             </TouchableOpacity>
//           </View>

//           {item.parentId && (
//             <Text className="text-gray-500 text-[13px] mb-1">
//               Replying to{" "}
//               <Text className="text-[#1d9bf0]">
//                 @{item.parent?.user?.name || "someone"}
//               </Text>
//             </Text>
//           )}

//           <Text className="text-[15px] leading-5 text-gray-800 mt-0.5">
//             {item.content}
//           </Text>

//           <View className="flex-row mt-3 items-center justify-between pr-10">
//             <TouchableOpacity
//               className="flex-row items-center"
//               onPress={() => {
//                 setReplyToId(item.id);
//                 setReplyTargetName(item.user?.name);
//                 setCommentContent("");
//               }}
//             >
//               <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
//               <Text className="text-gray-500 text-xs ml-1.5">
//                 {item.replies?.length || 0}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity className="flex-row items-center">
//               <Ionicons name="repeat-outline" size={18} color="#6B7280" />
//             </TouchableOpacity>

//             <TouchableOpacity className="flex-row items-center">
//               <Ionicons name="heart-outline" size={17} color="#6B7280" />
//             </TouchableOpacity>

//             <TouchableOpacity>
//               <Ionicons name="share-outline" size={16} color="#6B7280" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//       {item.replies?.map((reply: any) => (
//         <CommentItem key={reply.id} item={reply} isReply={true} />
//       ))}
//     </SafeAreaView>
//   );

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <View className="flex-row items-center px-4 py-2 border-b border-gray-50">
//         <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <Text className="text-xl font-extrabold ml-4">Post</Text>
//       </View>

//       <KeyboardAvoidingView
//         className="flex-1"
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
//       >
//         <FlatList
//           data={comments}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => <CommentItem item={item} />}
//           ListHeaderComponent={() => (
//             <View className="p-4 border-b border-gray-100">
//               <View className="flex-row items-center mb-3">
//                 <Image
//                   source={{
//                     uri:
//                       post?.author?.image || "https://via.placeholder.com/48",
//                   }}
//                   className="w-12 h-12 rounded-full mr-3 bg-gray-100"
//                 />
//                 <View>
//                   <Text className="font-extrabold text-[16px] text-gray-900">
//                     {post?.author?.name}
//                   </Text>
//                   <Text className="text-gray-500 text-[15px]">
//                     @{post?.author?.name?.toLowerCase().replace(/\s/g, "")}
//                   </Text>
//                 </View>
//                 {/* <TouchableOpacity
//                   className="ml-auto p-2 border border-gray-200 rounded-full px-4 py-1"
//                   onPress={() => followUser(post?.author?.id)}
//                 >
//                   <Text className="font-bold text-sm">Follow</Text>
//                 </TouchableOpacity> */}

//                 <TouchableOpacity
//                   className="ml-auto p-2 border border-gray-200 rounded-full px-4 py-1"
//                   onPress={() => handleFollowUser(post?.author?.id)}
//                   disabled={isFollowing}
//                 >
//                   <Text>{isFollowing ? "Following..." : "Follow"}</Text>
//                 </TouchableOpacity>
//               </View>

//               <Text className="text-[18px] leading-6 text-gray-900 mb-4">
//                 {post?.content}
//               </Text>

//               {post?.image && (
//                 <Image
//                   source={{ uri: post.image }}
//                   className="w-full h-64 rounded-2xl mb-4 border border-gray-50"
//                   resizeMode="cover"
//                 />
//               )}

//               <View className="flex-row items-center py-3 border-y border-gray-50">
//                 <Text className="text-gray-500 text-[15px]">
//                   <Text className="font-bold text-gray-900">
//                     {new Date(post?.createdAt).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </Text>
//                   {" · "}
//                   <Text className="font-bold text-gray-900">
//                     {new Date(post?.createdAt).toLocaleDateString([], {
//                       month: "short",
//                       day: "numeric",
//                       year: "numeric",
//                     })}
//                   </Text>
//                   {" · "}
//                   <Text className="font-bold text-gray-900">
//                     {post?._count?.shares || 0}
//                   </Text>{" "}
//                   Views
//                 </Text>
//               </View>

//               <View className="flex-row justify-between py-3 border-b border-gray-50 px-4">
//                 <TouchableOpacity className="flex-row items-center">
//                   <Ionicons
//                     name="chatbubble-outline"
//                     size={22}
//                     color="#6B7280"
//                   />
//                   <Text className="text-gray-500 ml-1">
//                     {post?._count?.comments || 0}
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   className="flex-row items-center"
//                   onPress={() => repostPost({ id: post.id })}
//                 >
//                   <Ionicons name="repeat-outline" size={24} color="#6B7280" />
//                   <Text className="text-gray-500 ml-1">
//                     {post?._count?.reposts || 0}
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   className="flex-row items-center"
//                   onPress={() => likePost({ postId: post.id })}
//                 >
//                   {(() => {
//                     const hasLiked = post?.likes?.some(
//                       (l: any) => l.userId === user?.id,
//                     );
//                     return (
//                       <>
//                         <Ionicons
//                           name={hasLiked ? "heart" : "heart-outline"}
//                           size={22}
//                           color={hasLiked ? "#F91880" : "#6B7280"}
//                         />
//                         <Text
//                           className={`ml-1 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
//                         >
//                           {post?._count?.likes || 0}
//                         </Text>
//                       </>
//                     );
//                   })()}
//                 </TouchableOpacity>
//                 <View className="flex-row items-center">
//                   <Ionicons
//                     name="stats-chart-outline"
//                     size={22}
//                     color="#6B7280"
//                   />
//                   <Text className="text-gray-500 ml-1">{post?.views || 0}</Text>
//                 </View>
//                 <TouchableOpacity
//                   className="flex-row items-center"
//                   onPress={() => bookmarkPost(post.id)}
//                 >
//                   {(() => {
//                     const isBookmarked = post.bookmarks?.length > 0;
//                     return (
//                       <Ionicons
//                         name={isBookmarked ? "bookmark" : "bookmark-outline"}
//                         size={22}
//                         color={isBookmarked ? "#1d9bf0" : "#6B7280"}
//                       />
//                     );
//                   })()}
//                 </TouchableOpacity>
//                 <TouchableOpacity>
//                   <Ionicons name="share-outline" size={22} color="#6B7280" />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}
//         />

//         {/* Reply Input */}
//         <View>
//           {/* <View edges={["bottom"]}> */}
//           {replyToId && (
//             <View className="px-4 py-2 bg-gray-50 flex-row justify-between items-center border-t border-gray-100">
//               <Text className="text-gray-500 text-sm">
//                 Replying to{" "}
//                 <Text className="text-[#1d9bf0]">@{replyTargetName}</Text>
//               </Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   setReplyToId(null);
//                   setReplyTargetName(null);
//                 }}
//               >
//                 <Ionicons name="close-circle" size={18} color="#6B7280" />
//               </TouchableOpacity>
//             </View>
//           )}
//           <View className="flex-row items-center p-3 border-t border-gray-50 bg-white">
//             <Image
//               source={{ uri: user?.image || "https://via.placeholder.com/40" }}
//               className="w-10 h-10 rounded-full mr-3 bg-gray-100"
//             />
//             <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex-row items-center">
//               <TextInput
//                 placeholder="Post your reply"
//                 placeholderTextColor="#9CA3AF"
//                 className="flex-1 text-[16px] py-1 text-gray-900"
//                 value={commentContent}
//                 onChangeText={setCommentContent}
//                 multiline
//               />
//             </View>
//             <TouchableOpacity
//               onPress={handleSendComment}
//               className={`ml-3 px-4 py-2 rounded-full ${commentContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"}`}
//               disabled={!commentContent.trim()}
//             >
//               <Text className="font-bold text-white">Reply</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>

//       <PostOptionsModal
//         isVisible={optionsModalVisible}
//         onClose={() => {
//           setOptionsModalVisible(false);
//           setItemForOptions(null);
//         }}
//         isOwner={
//           itemForOptions?.user?.id === user?.id ||
//           itemForOptions?.author?.id === user?.id
//         }
//         onDelete={() => {
//           alert("Delete functionality coming soon");
//           setOptionsModalVisible(false);
//         }}
//         onReport={() => {
//           alert("Reported.");
//           setOptionsModalVisible(false);
//         }}
//         onBlock={() => {
//           alert("Blocked.");
//           setOptionsModalVisible(false);
//         }}
//       />
//     </SafeAreaView>
//   );
// }
