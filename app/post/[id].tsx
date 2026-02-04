import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetPostQuery,
  useGetCommentsQuery,
  useCommentPostMutation,
  useLikePostMutation,
  useRepostPostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";
import { useFollowUserMutation } from "@/store/profileApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  const [commentContent, setCommentContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);

  // 1. Call hook at TOP LEVEL of the component
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();

  const { data: post, isLoading: isPostLoading } = useGetPostQuery(id);
  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useGetCommentsQuery(id);

  const [commentPost] = useCommentPostMutation();
  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();

  const handleSendComment = async () => {
    if (!commentContent.trim()) return;
    try {
      await commentPost({
        id: id as string,
        content: commentContent,
        parentId: replyToId || undefined,
      }).unwrap();
      setCommentContent("");
      setReplyToId(null);
      setReplyTargetName(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!userId) return;

    try {
      // 2. Call the trigger function here (not the hook!)
      await followUser(userId); // Use the trigger function with ID string
      console.log("Follow successful");
      // toast.success("Followed!") or whatever
    } catch (err) {
      console.error("Follow failed", err);
      // toast.error(...)
    }
  };

  if (isPostLoading || isCommentsLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  const CommentItem = ({
    item,
    isReply = false,
  }: {
    item: any;
    isReply?: boolean;
  }) => (
    <SafeAreaView
      className={`bg-white ${isReply ? "ml-12" : "border-b border-gray-50"}`}
    >
      <View className="flex-row p-4">
        <Image
          source={{ uri: item.user?.image || "https://via.placeholder.com/40" }}
          className="w-10 h-10 rounded-full mr-3 bg-gray-100"
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="font-bold text-[15px] text-gray-900">
                {item.user?.name}
              </Text>
              <Text className="text-gray-500 text-[14px] ml-1">
                · {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity className="p-1">
              <Ionicons name="ellipsis-horizontal" size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {item.parentId && (
            <Text className="text-gray-500 text-[13px] mb-1">
              Replying to{" "}
              <Text className="text-[#1d9bf0]">
                @{item.parent?.user?.name || "someone"}
              </Text>
            </Text>
          )}

          <Text className="text-[15px] leading-5 text-gray-800 mt-0.5">
            {item.content}
          </Text>

          <View className="flex-row mt-3 items-center justify-between pr-10">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => {
                setReplyToId(item.id);
                setReplyTargetName(item.user?.name);
                setCommentContent("");
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1.5">
                {item.replies?.length || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="repeat-outline" size={18} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="heart-outline" size={17} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity>
              <Ionicons name="share-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {item.replies?.map((reply: any) => (
        <CommentItem key={reply.id} item={reply} isReply={true} />
      ))}
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold ml-4">Post</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentItem item={item} />}
          ListHeaderComponent={() => (
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center mb-3">
                <Image
                  source={{
                    uri:
                      post?.author?.image || "https://via.placeholder.com/48",
                  }}
                  className="w-12 h-12 rounded-full mr-3 bg-gray-100"
                />
                <View>
                  <Text className="font-extrabold text-[16px] text-gray-900">
                    {post?.author?.name}
                  </Text>
                  <Text className="text-gray-500 text-[15px]">
                    @{post?.author?.name?.toLowerCase().replace(/\s/g, "")}
                  </Text>
                </View>
                {/* <TouchableOpacity
                  className="ml-auto p-2 border border-gray-200 rounded-full px-4 py-1"
                  onPress={() => followUser(post?.author?.id)}
                >
                  <Text className="font-bold text-sm">Follow</Text>
                </TouchableOpacity> */}

                <TouchableOpacity
                  className="ml-auto p-2 border border-gray-200 rounded-full px-4 py-1"
                  onPress={() => handleFollowUser(post?.author?.id)}
                  disabled={isFollowing}
                >
                  <Text>{isFollowing ? "Following..." : "Follow"}</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-[18px] leading-6 text-gray-900 mb-4">
                {post?.content}
              </Text>

              {post?.image && (
                <Image
                  source={{ uri: post.image }}
                  className="w-full h-64 rounded-2xl mb-4 border border-gray-50"
                  resizeMode="cover"
                />
              )}

              <View className="flex-row items-center py-3 border-y border-gray-50">
                <Text className="text-gray-500 text-[15px]">
                  <Text className="font-bold text-gray-900">
                    {new Date(post?.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {" · "}
                  <Text className="font-bold text-gray-900">
                    {new Date(post?.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  {" · "}
                  <Text className="font-bold text-gray-900">
                    {post?._count?.shares || 0}
                  </Text>{" "}
                  Views
                </Text>
              </View>

              <View className="flex-row justify-between py-3 border-b border-gray-50 px-4">
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color="#6B7280"
                  />
                  <Text className="text-gray-500 ml-1">
                    {post?._count?.comments || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => repostPost({ id: post.id })}
                >
                  <Ionicons name="repeat-outline" size={24} color="#6B7280" />
                  <Text className="text-gray-500 ml-1">
                    {post?._count?.reposts || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => likePost({ postId: post.id })}
                >
                  {(() => {
                    const hasLiked = post?.likes?.some(
                      (l: any) => l.userId === user?.id,
                    );
                    return (
                      <>
                        <Ionicons
                          name={hasLiked ? "heart" : "heart-outline"}
                          size={22}
                          color={hasLiked ? "#F91880" : "#6B7280"}
                        />
                        <Text
                          className={`ml-1 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
                        >
                          {post?._count?.likes || 0}
                        </Text>
                      </>
                    );
                  })()}
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="bookmark-outline" size={22} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="share-outline" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Reply Input */}
        <View>
          {/* <View edges={["bottom"]}> */}
          {replyToId && (
            <View className="px-4 py-2 bg-gray-50 flex-row justify-between items-center border-t border-gray-100">
              <Text className="text-gray-500 text-sm">
                Replying to{" "}
                <Text className="text-[#1d9bf0]">@{replyTargetName}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyToId(null);
                  setReplyTargetName(null);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center p-3 border-t border-gray-50 bg-white">
            <Image
              source={{ uri: user?.image || "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full mr-3 bg-gray-100"
            />
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex-row items-center">
              <TextInput
                placeholder="Post your reply"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-[16px] py-1 text-gray-900"
                value={commentContent}
                onChangeText={setCommentContent}
                multiline
              />
            </View>
            <TouchableOpacity
              onPress={handleSendComment}
              className={`ml-3 px-4 py-2 rounded-full ${commentContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"}`}
              disabled={!commentContent.trim()}
            >
              <Text className="font-bold text-white">Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
