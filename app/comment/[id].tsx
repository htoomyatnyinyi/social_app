import React, { useState, useCallback, useRef, useEffect } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetCommentQuery,
  useCommentPostMutation,
  useLikeCommentMutation,
  useRepostCommentMutation,
  useIncrementCommentViewCountMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import PostOptionsModal from "../../components/PostOptionsModal";

export default function CommentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: any }>();
  const router = useRouter();
  const currentUser = useSelector((state: any) => state.auth.user);

  const [commentContent, setCommentContent] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const inputRef = useRef<TextInput>(null);

  const {
    data: comment,
    isLoading,
    refetch,
  } = useGetCommentQuery(id!, {
    skip: !id,
  });

  const [commentPost] = useCommentPostMutation();
  const [likeComment] = useLikeCommentMutation();
  const [repostComment] = useRepostCommentMutation();
  const [incrementView] = useIncrementCommentViewCountMutation();

  useEffect(() => {
    if (comment?.postId && comment?.id) {
      incrementView({ postId: comment.postId, commentId: comment.id })
        .unwrap()
        .then(() => {
          refetch();
        });
    }
  }, [comment?.postId, comment?.id, incrementView, refetch]);

  const handleMainCommentShare = useCallback(async () => {
    try {
      if (!comment) return;
      const urlToShare = `https://oasis-social.com/comment/${comment.id}`;
      await Share.share({
        message: `Check out this comment by @${comment.user?.username || comment.user?.name}: "${comment.content}"\n${urlToShare}`,
      });
    } catch (error) {
      console.error("Error sharing comment:", error);
    }
  }, [comment]);

  const handleReplyShare = useCallback(async (item: any) => {
    try {
      const urlToShare = `https://oasis-social.com/comment/${item.id}`;
      await Share.share({
        message: `Check out this reply by @${item.user?.username || item.user?.name}: "${item.content}"\n${urlToShare}`,
      });
    } catch (error) {
      console.error("Error sharing reply:", error);
    }
  }, []);

  const handleSendComment = useCallback(async () => {
    if (!commentContent.trim() || !comment?.postId) return;

    const content = commentContent.trim();
    setCommentContent("");

    try {
      await commentPost({
        id: comment.postId,
        content,
        parentId: id, // replying to this specific comment
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Reply failed", err);
    }
  }, [commentContent, comment?.postId, id, commentPost, refetch]);

  const handleCommentLike = useCallback(
    async (item: any) => {
      try {
        await likeComment({ postId: item.postId, commentId: item.id }).unwrap();
        refetch();
      } catch (err) {
        console.error("Failed to like comment:", err);
      }
    },
    [likeComment, refetch],
  );

  const handleCommentRepost = useCallback(
    async (item: any) => {
      try {
        await repostComment({
          postId: item.postId,
          commentId: item.id,
        }).unwrap();
        refetch();
      } catch (err) {
        console.error("Failed to repost comment:", err);
      }
    },
    [repostComment, refetch],
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  if (!comment) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500 text-lg">Comment not found</Text>
      </SafeAreaView>
    );
  }

  const hasLikedMain = comment.commentLikes?.some(
    (l: any) => l.userId === currentUser?.id,
  );
  const hasRepostedMain = comment.commentReposts?.some(
    (r: any) => r.userId === currentUser?.id,
  );

  const renderReply = ({ item }: { item: any }) => {
    const hasLiked = item.commentLikes?.some(
      (l: any) => l.userId === currentUser?.id,
    );
    const hasReposted = item.commentReposts?.some(
      (r: any) => r.userId === currentUser?.id,
    );

    return (
      <View className="border-b border-gray-100 bg-white">
        <TouchableOpacity
          onPress={() => router.push(`/comment/${item.id}`)}
          className="flex-row p-4"
        >
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
              <TouchableOpacity
                onPress={() => {
                  setSelectedItem(item);
                  setOptionsVisible(true);
                }}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-[#1d9bf0] text-[13.5px] mb-1">
              Replying to @{comment.user.name}
            </Text>

            <Text className="text-[15px] leading-6 text-gray-800">
              {item.content}
            </Text>

            <View className="flex-row mt-3 items-center justify-between pr-4">
              <TouchableOpacity className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={17} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {item._count?.replies ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => handleCommentRepost(item)}
              >
                <Ionicons
                  name="repeat-outline"
                  size={18}
                  color={hasReposted ? "#00BA7C" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasReposted ? "text-[#00BA7C]" : "text-gray-500"}`}
                >
                  {item._count?.commentReposts ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => handleCommentLike(item)}
              >
                <Ionicons
                  name={hasLiked ? "heart" : "heart-outline"}
                  size={18}
                  color={hasLiked ? "#F91880" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
                >
                  {item._count?.commentLikes ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center">
                <Ionicons
                  name="stats-chart-outline"
                  size={17}
                  color="#6B7280"
                />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {item.views ?? 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleReplyShare(item)}>
                <Ionicons name="share-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

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
          data={comment.replies}
          keyExtractor={(item) => item.id}
          renderItem={renderReply}
          ListHeaderComponent={
            <View className="p-4 bg-white border-b border-gray-100">
              {/* Parent Context */}
              <TouchableOpacity
                onPress={() => router.push(`/post/${comment.postId}`)}
              >
                {comment.parent ? (
                  <Text className="text-[#1d9bf0] text-[13.5px] mb-2 font-medium">
                    Show thread
                  </Text>
                ) : (
                  <Text className="text-[#1d9bf0] text-[13.5px] mb-2 font-medium">
                    View original post
                  </Text>
                )}
              </TouchableOpacity>

              {/* Author row */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center">
                  <Image
                    source={{
                      uri:
                        comment.user?.image || "https://via.placeholder.com/48",
                    }}
                    className="w-12 h-12 rounded-full mr-3 bg-gray-100"
                  />
                  <View>
                    <Text className="font-bold text-[16px] text-gray-900">
                      {comment.user?.name || "User"}
                    </Text>
                    <Text className="text-gray-500 text-[14.5px]">
                      @
                      {comment.user?.username ||
                        comment.user?.name?.toLowerCase().replace(/\s+/g, "")}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedItem(comment);
                    setOptionsVisible(true);
                  }}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <Text className="text-[17px] leading-6 text-gray-900 mb-4">
                {comment.content}
              </Text>

              {/* Timestamp */}
              <View className="flex-row items-center py-2.5 border-y border-gray-100 mb-2">
                <Text className="text-gray-600 text-[15px]">
                  {new Date(comment.createdAt).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  ·{" "}
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>

              {/* Action bar */}
              <View className="flex-row justify-between items-center py-2 px-6">
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color="#6B7280"
                  />
                  <Text className="text-gray-600 text-[15px] ml-2">
                    {comment._count?.replies ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => handleCommentRepost(comment)}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={24}
                    color={hasRepostedMain ? "#00BA7C" : "#6B7280"}
                  />
                  <Text className="text-gray-600 text-[15px] ml-2">
                    {comment._count?.commentReposts ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => handleCommentLike(comment)}
                >
                  <Ionicons
                    name={hasLikedMain ? "heart" : "heart-outline"}
                    size={23}
                    color={hasLikedMain ? "#F91880" : "#6B7280"}
                  />
                  <Text
                    className={`text-[15px] ml-2 ${
                      hasLikedMain
                        ? "text-[#F91880] font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    {comment._count?.commentLikes ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center">
                  <Ionicons
                    name="stats-chart-outline"
                    size={22}
                    color="#6B7280"
                  />
                  <Text className="text-gray-600 text-[15px] ml-2">
                    {comment.views ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleMainCommentShare}>
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
        <View className="border-t border-gray-100 bg-white shadow-sm pb-1">
          <View className="flex-row items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <Text className="text-gray-600 text-[14.5px]">
              Replying to{" "}
              <Text className="text-[#1d9bf0]">@{comment.user?.name}</Text>
            </Text>
          </View>

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
          alert("Delete functionality pending");
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
