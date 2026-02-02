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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetCommentsQuery,
  useCommentPostMutation,
  useLikePostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  const [commentContent, setCommentContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const { data: comments, isLoading } = useGetCommentsQuery(id);
  const [commentPost] = useCommentPostMutation();
  const [likePost] = useLikePostMutation();

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
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
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
    <View
      className={`flex-row p-4 border-b border-gray-50 ${isReply ? "ml-10 bg-gray-50/50" : "bg-white"}`}
    >
      <Image
        source={{ uri: item.user?.image || "https://via.placeholder.com/32" }}
        className="w-8 h-8 rounded-full mr-3"
      />
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-bold text-sm">{item.user?.name}</Text>
          <Text className="text-gray-500 text-xs ml-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text className="text-[15px] mt-1">{item.content}</Text>

        <View className="flex-row mt-2 items-center">
          <TouchableOpacity
            className="flex-row items-center mr-4"
            onPress={() => {
              setReplyToId(item.id);
              setCommentContent(`@${item.user?.name} `);
            }}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="heart-outline" size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {item.replies?.map((reply: any) => (
          <CommentItem key={reply.id} item={reply} isReply={true} />
        ))}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-4">Post</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem item={item} />}
        ListHeaderComponent={() => (
          <View className="p-4 border-b border-gray-100">
            {/* We could fetch the post detail here as well, but for now we'll just show comments */}
            <Text className="text-gray-500 text-center py-4">
              Full post details and thread
            </Text>
          </View>
        )}
      />

      {/* Input Field */}
      <View className="flex-row items-center p-3 border-t border-gray-100 bg-white">
        <Image
          source={{ uri: user?.image || "https://via.placeholder.com/32" }}
          className="w-8 h-8 rounded-full mr-3"
        />
        <TextInput
          placeholder={replyToId ? "Post your reply" : "Post your comment"}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2"
          value={commentContent}
          onChangeText={setCommentContent}
          multiline
        />
        <TouchableOpacity
          onPress={handleSendComment}
          className="ml-3"
          disabled={!commentContent.trim()}
        >
          <Text
            className={`font-bold ${commentContent.trim() ? "text-[#1d9bf0]" : "text-sky-200"}`}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
