import React, { useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetPostsQuery,
  useLikePostMutation,
  useCreatePostMutation,
  useCommentPostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState("public");
  const [newPostContent, setNewPostContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const user = useSelector((state: any) => state.auth.user);

  const {
    data: posts,
    isLoading,
    refetch,
    isFetching,
  } = useGetPostsQuery(activeTab);
  const [likePost] = useLikePostMutation();
  const [createPost] = useCreatePostMutation();
  const [commentPost] = useCommentPostMutation();

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      await createPost({
        content: newPostContent,
        isPublic: activeTab === "public",
      }).unwrap();
      setNewPostContent("");
      setIsComposing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim() || !selectedPostId) return;
    try {
      await commentPost({
        id: selectedPostId,
        content: commentContent,
      }).unwrap();
      setCommentContent("");
      setIsCommenting(false);
    } catch (e) {
      console.error(e);
    }
  };

  const PostCard = ({ item }: { item: any }) => (
    <View className="flex-row p-4 border-b border-gray-100 bg-white">
      <View className="mr-3">
        <Image
          source={{
            uri: item.author?.image || "https://via.placeholder.com/40",
          }}
          className="w-12 h-12 rounded-full"
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="font-bold text-[15px] mr-1" numberOfLines={1}>
            {item.author?.name || "Anonymous"}
          </Text>
          <Text className="text-gray-500 text-[14px]">
            · {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <TouchableOpacity className="ml-auto">
            <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text className="text-[15px] leading-5 text-black mb-3">
          {item.content}
        </Text>

        <View className="flex-row justify-between pr-4 mt-1">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => {
              setSelectedPostId(item.id);
              setIsCommenting(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">
              {item._count?.comments || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="repeat-outline" size={18} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">
              {item._count?.shares || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => likePost(item.id)}
          >
            {(() => {
              const hasLiked = item.likes?.some(
                (l: any) => l.userId === user?.id,
              );
              return (
                <>
                  <Ionicons
                    name={hasLiked ? "heart" : "heart-outline"}
                    size={18}
                    color={hasLiked ? "#F91880" : "#6B7280"}
                  />
                  <Text
                    className={`text-xs ml-1 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
                  >
                    {item._count?.likes || 0}
                  </Text>
                </>
              );
            })()}
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="stats-chart-outline" size={18} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">
              {Math.floor(Math.random() * 100)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="share-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row border-b border-gray-100 pt-2">
        <TouchableOpacity
          onPress={() => setActiveTab("public")}
          className="flex-1 items-center pb-3"
        >
          <Text
            className={`font-semibold ${activeTab === "public" ? "text-black" : "text-gray-500"}`}
          >
            For you
          </Text>
          {activeTab === "public" && (
            <View className="absolute bottom-0 w-14 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("private")}
          className="flex-1 items-center pb-3"
        >
          <Text
            className={`font-semibold ${activeTab === "private" ? "text-black" : "text-gray-500"}`}
          >
            Following
          </Text>
          {activeTab === "private" && (
            <View className="absolute bottom-0 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard item={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isFetching}
            onRefresh={refetch}
            tintColor="#1d9bf0"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {!isComposing && (
        <TouchableOpacity
          onPress={() => setIsComposing(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#1d9bf0] rounded-full items-center justify-center shadow-lg"
          style={{ elevation: 5 }}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      {isComposing && (
        <View className="absolute inset-0 bg-white z-50">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <TouchableOpacity onPress={() => setIsComposing(false)}>
              <Text className="text-[17px]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreatePost}
              className={`px-4 py-1.5 rounded-full ${newPostContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"}`}
            >
              <Text className="text-white font-bold">Post</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row p-4">
            <Image
              source={{ uri: "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <TextInput
              autoFocus
              multiline
              placeholder="What's happening?"
              className="flex-1 text-[19px] pt-1"
              value={newPostContent}
              onChangeText={setNewPostContent}
              textAlignVertical="top"
            />
          </View>
        </View>
      )}
      {isCommenting && (
        <View className="absolute inset-0 bg-white z-50">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <TouchableOpacity onPress={() => setIsCommenting(false)}>
              <Text className="text-[17px]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleComment}
              className={`px-4 py-1.5 rounded-full ${commentContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"}`}
            >
              <Text className="text-white font-bold">Reply</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row p-4">
            <Image
              source={{ uri: user?.image || "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <TextInput
              autoFocus
              multiline
              placeholder="Post your reply"
              className="flex-1 text-[19px] pt-1"
              value={commentContent}
              onChangeText={setCommentContent}
              textAlignVertical="top"
            />
          </View>
        </View>
      )}
    </View>
  );
}
